import { NextRequest, NextResponse } from "next/server";
import hosPool from "@/lib/dbhos";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || new Date().toISOString().slice(0, 10);
    const endDate = searchParams.get("endDate") || startDate;
    const pttypeParam = searchParams.get("pttype") || "";
    const pttypes = pttypeParam ? pttypeParam.split(",").filter(Boolean) : [];

    const sql = `
    SELECT
      o.hn AS hn
      ,o.an AS an
      ,ge.name AS sex
      ,CONCAT(v.age_y,' ปี ',v.age_m,' เดือน ',v.age_d,' วัน') AS age
      ,v.age_y
      ,v.age_m
      ,v.age_d
      ,pt.hometel
      ,pt.mobile_phone_number
      ,pt.informtel
      ,CONCAT(pt.nationality,':',n.name) AS nationality
      ,ii.regdate
      ,ii.regtime
      ,ii.dchdate
      ,ii.dchtime
      ,v.admdate
      ,it.ipt_type_name
      ,CONCAT(rf.docno,'#',rf.refer_hospcode) AS referin
      ,w.name AS ward
      ,i.bedno
      ,sp.name AS spclty
      ,ii.prediag
      ,GROUP_CONCAT(DISTINCT IF(dx.icd10 NOT REGEXP '^[0-9]' AND dx.diagtype=1,dx.icd10,NULL)) AS pdx
      ,GROUP_CONCAT(DISTINCT IF(dx.icd10 NOT REGEXP '^[0-9]' AND dx.diagtype<>1,CONCAT(dx.icd10,'(',dx.diagtype,')'),NULL) ORDER BY dx.diagtype,ipt_diag_id) AS sdx
      ,v.diag_text_list
      ,GROUP_CONCAT(DISTINCT IF(dx.icd10 REGEXP '^[0-9]',dx.icd10,NULL) ORDER BY dx.diagtype,ipt_diag_id) AS proc_code
      ,os.pttype_check
      ,ptt.hipdata_code
      ,ptt.pttype_eclaim_id
      ,e.name AS pttype_eclaim_name
      ,ii.pttype AS pttype_hos
      ,ptt.name AS pttypename
      ,CONCAT(vs.hospmain,'#',h.name) AS hospmain
      ,CONCAT(vs.hospmain,'#',h2.name) AS hospsub
      ,e.gf_ipd AS gfmis
      ,e.ar_ipd AS ar_code
      ,vs.pttypeno
      ,CONCAT(ro.refer_number,'#',ro.refer_hospcode) AS referout
      ,v.income
      ,v.discount_money
      ,v.rcpt_money
      ,r.rcpno
      ,r.bill_date_time
      ,v.income - v.rcpt_money AS claim_debt
      ,ovs.name AS ovstost_name
      ,dc.name AS dchstts_name
      ,dt.name AS dchtype_name
      ,ii.adjrw
      ,rd.adjrw AS adjrw_repdata
      ,rd.adjrw2 AS adjrw2_repdata
      ,rd.baserated
      ,ii.grouper_version
      ,ii.grouper_err
      ,ii.grouper_warn
      ,ii.drg
      ,ii.mdc
      ,ii.rw
      ,ii.wtlos
      ,ii.ot
      ,ii.bw
      ,d.name AS adm_doctor
      ,d2.name AS dch_doctor
      ,d3.name AS incharge_doctor
      ,rd.compensated
      ,GROUP_CONCAT(DISTINCT rd.rep,' # ',ROUND(rd.compensated,2),'B  ') AS rep
      ,rd.TransactionType
      ,rd.percentpay
      ,rd.SendDate
      ,rd.Diff
      ,rd.Down
      ,rd.Up
      ,TIMESTAMPDIFF(DAY,v.dchdate,rd.SendDate) AS cc
      ,TIMESTAMPDIFF(DAY,v.dchdate,idd.diag_datetime) AS bb
      ,re.rep AS rep_invoice
      ,re.id AS re_id
      ,re.resource
      ,re.compensated AS compensated_invoice
      ,re.Diff AS diffinvoice
      ,re.Down AS downinvoice
      ,re.Up AS upinvoice
      ,rd.fund
      ,rd.subfund
      ,rd.remark
      ,rd.projectcode
      ,re.PaidType
      ,re.Bill
      ,re.Bill_date
      ,cb.cipn_billtran_id
      ,cbe.err_code AS cipn_err_code
      ,cbe.err_desc AS cipn_err_desc
      ,cb.cipn_confirm_doc_no
      ,v.pdx AS pdx_anstat
      ,ii.data_exp_date
      ,TIMESTAMPDIFF(DAY,v.dchdate,ii.data_exp_date) AS daycomplete
      ,opd.name AS coder
      ,vl.CODE_NAME
      ,vl.REMARKDATA
      ,re.filename AS repfilename
      ,rd.filename AS stmfilename
      ,idd.diag_text AS ipt_diag_text
      ,idd.diag_datetime
      ,d4.name AS doctor_diag_text
      ,fcs.fdh_claim_status_message
      ,rs.StatusName AS status_eclaim
      ,fcsd.fdh_error_code
      ,rd.errorcode AS error_eclaim
      ,fcsd.fdh_error_desc
      ,ipt.ipt_summary_status_name
      ,ii.data_ok
      ,vs.auth_code AS AuthenCode
    FROM ovst o
      JOIN an_stat v ON v.an = o.an
      LEFT JOIN ipt ii ON ii.an = v.an
      LEFT JOIN iptadm i ON i.an = v.an
      JOIN patient pt ON pt.hn = o.hn
      LEFT JOIN sex ge ON ge.code = pt.sex
      LEFT JOIN pttype ptt ON ptt.pttype = ii.pttype
      LEFT JOIN pttype_eclaim e ON e.code = ptt.pttype_eclaim_id
      LEFT JOIN opdscreen s ON s.vn = o.vn
      LEFT JOIN rcpt_print r ON r.vn = o.vn
      LEFT JOIN ipt_pttype vs ON vs.an = v.an
      LEFT JOIN ipt_type it ON it.ipt_type = ii.ipt_type
      LEFT JOIN dchstts dc ON dc.dchstts = ii.dchstts
      LEFT JOIN dchtype dt ON dt.dchtype = ii.dchtype
      LEFT JOIN referin rf ON rf.vn = v.vn
      LEFT JOIN referout ro ON ro.vn = v.vn
      LEFT JOIN ward w ON w.ward = v.ward
      LEFT JOIN spclty sp ON sp.spclty = o.spclty
      LEFT JOIN hospcode h ON h.hospcode = vs.hospmain
      LEFT JOIN hospcode h2 ON h2.hospcode = vs.hospsub
      LEFT JOIN ovstost ovs ON ovs.ovstost = o.ovstost
      LEFT JOIN ovst_seq os ON os.vn = o.vn
      LEFT JOIN nationality n ON n.nationality = pt.nationality
      LEFT JOIN iptdiag dx ON dx.an = o.an
      LEFT JOIN rcmdb.repdata rd ON rd.an = o.an
      LEFT JOIN eclaimdb.l_validatedata vl ON vl.CODE_ID = rd.ErrorCode
      LEFT JOIN rcmdb.repeclaim re ON re.an = o.an
      LEFT JOIN fdh_claim_status fcs ON fcs.vn = o.vn
      LEFT JOIN fdh_claim_status_detail fcsd ON fcsd.fdh_claim_status_id = fcs.fdh_claim_status_id
      LEFT JOIN iptadm ip ON ip.an = v.an
      LEFT JOIN doctor d ON d.code = ii.admdoctor
      LEFT JOIN doctor d2 ON d2.code = ii.dch_doctor
      LEFT JOIN doctor d3 ON d3.code = ii.incharge_doctor
      LEFT JOIN opduser opd ON opd.loginname = dx.staff
      LEFT JOIN rcmdb.repstatus rs ON rs.seq = o.an
      LEFT JOIN ipt_summary_status ipt ON ipt.ipt_summary_status_id = ii.ipt_summary_status_id
      LEFT JOIN cipn_billtran cb ON cb.an = o.an
      LEFT JOIN cipn_billtran_err cbe ON cbe.an = o.an
      LEFT JOIN ipt_doctor_diag idd ON idd.an = o.an AND idd.diagtype = 1
      LEFT JOIN doctor d4 ON d4.code = idd.doctor_code
    WHERE v.dchdate BETWEEN ? AND ?
      AND (o.an IS NOT NULL AND o.an <> '')
    ${pttypes.length > 0 ? `AND ii.pttype IN (${pttypes.map(() => '?').join(',')})` : ''}
    GROUP BY o.an
    ORDER BY o.an ASC
    `;

    const params: (string | number)[] = [startDate, endDate, ...pttypes];
    const [rows] = await hosPool.execute<RowDataPacket[]>(sql, params);

    return NextResponse.json({
      success: true,
      data: rows,
      total: rows.length,
      startDate,
      endDate,
    });
  } catch (error: unknown) {
    console.error("IPD query error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
