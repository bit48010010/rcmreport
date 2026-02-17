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
      o.hn
      ,o.vn
      ,o.an
      ,ge.name AS sex
      ,v.age_y
      ,v.age_m
      ,v.age_d
      ,pt.hometel
      ,pt.mobile_phone_number
      ,pt.informtel
      ,vs.auth_code
      ,cp.nhso_authen_code AS authen_endpoint
      ,CONCAT(pt.nationality,':',n.name) AS nationality
      ,CONCAT(DAY(o.vstdate),'/',MONTH(o.vstdate),'/',YEAR(o.vstdate)+543) AS vstdate
      ,o.vsttime
      ,ps.name AS pt_subtype
      ,ov.name AS ovstist
      ,CONCAT(rf.docno,'#',rf.refer_hospcode) AS referin
      ,k.department
      ,sp.name AS spclty
      ,s.bpd
      ,s.bps
      ,s.bw
      ,s.hr
      ,s.pulse
      ,s.rr
      ,s.temperature
      ,s.height
      ,s.bmi
      ,s.waist
      ,s.pe
      ,s.hpi
      ,ph.hpi_text
      ,s.pmh
      ,s.cc
      ,s.symptom
      ,GROUP_CONCAT(DISTINCT IF(dx.icd10 NOT REGEXP '^[0-9]' AND dx.diagtype=1,dx.icd10,NULL)) AS pdx
      ,GROUP_CONCAT(DISTINCT IF(dx.icd10 NOT REGEXP '^[0-9]' AND dx.diagtype<>1,CONCAT(dx.icd10,'(',dx.diagtype,')'),NULL) ORDER BY dx.diagtype,ovst_diag_id) AS sdx
      ,o.diag_text
      ,vd.diag_text AS diag_text_2
      ,GROUP_CONCAT(DISTINCT IF(dx.dx_code_note<>1,CONCAT(d.name,':',dx.dx_code_note),NULL) ORDER BY dx.dx_code_note) AS diag_text_detail
      ,GROUP_CONCAT(DISTINCT IF(dx.icd10 REGEXP '^[0-9]',dx.icd10,NULL) ORDER BY dx.diagtype,ovst_diag_id) AS proc_code
      ,os.pttype_check
      ,ptt.hipdata_code
      ,CONCAT(ptt.pttype_eclaim_id,':',e.name) AS pttype_eclaim
      ,CONCAT(ptt.pttype,':',ptt.name) AS pttypename
      ,CONCAT(v.hospmain,'#',h.name) AS hospmain
      ,CONCAT(v.hospmain,'#',h2.name) AS hospsub
      ,e.gf_opd
      ,e.ar_opd
      ,ca.name AS ovst_ca
      ,CONCAT(ro.refer_number,':',ro.refer_hospcode) AS referout
      ,v.income
      ,v.discount_money
      ,v.rcpt_money
      ,r.rcpno
      ,r.bill_date_time
      ,v.income - v.rcpt_money AS nee
      ,kt.ApprovalCode
      ,kt.terminalid
      ,kt.amount AS kt_amount
      ,ovs.name AS ovstost_name
      ,rd.id AS rd_id
      ,GROUP_CONCAT(DISTINCT rd.rep,' # ',ROUND(rd.compensated,2),'B  ') AS rep
      ,rd.compensated
      ,rd.percentpay
      ,rd.SendDate
      ,rd.Diff
      ,rd.Down
      ,rd.Up
      ,rd.TransactionType
      ,re.rep AS rep_invoice
      ,re.compensated AS compensated_invoice
      ,re.Diff AS diffinvoice
      ,re.Down AS downinvoice
      ,re.Up AS upinvoice
      ,re.Bill
      ,re.Bill_date
      ,re.resource
      ,rd.fund
      ,rd.subfund
      ,rd.remark
      ,rd.projectcode
      ,re.PaidType
      ,re.filename AS repfilename_invoice
      ,CONCAT(d.name,' # ',d.licenseno) AS doctorname
      ,informaddr AS address
      ,ovs.ovstost
      ,vs.nhso_ucae_type_code
      ,nc.nhso_ucae_type_name
      ,v.count_in_day
      ,v.count_in_month
      ,v.count_in_year
      ,oc.name AS occupation
      ,vl.CODE_NAME
      ,vl.REMARKDATA
      ,re.filename AS repfilename
      ,rd.filename AS stmfilename
      ,fcs.fdh_claim_status_message
      ,rs.StatusName AS status_eclaim
      ,fcs.fdh_act_amt
      ,fcs.fdh_settle_at
      ,fcs.fdh_stm_period
      ,fcsd.fdh_error_code
      ,fcsd.fdh_error_desc
      ,rd.errorcode AS error_eclaim
      ,fcs.fdh_reservation_status
      ,v.debt_id_list AS invoice_number
      ,vs.confirm_and_locked
      ,vs.request_funds
    FROM ovst o
      LEFT OUTER JOIN vn_stat v ON v.vn=o.vn
      LEFT OUTER JOIN patient pt ON pt.hn=o.hn
      LEFT OUTER JOIN pttype ptt ON ptt.pttype=o.pttype
      LEFT OUTER JOIN pttype_eclaim e ON e.code=ptt.pttype_eclaim_id
      LEFT OUTER JOIN codeaccount ca ON ca.code=e.ar_opd
      LEFT OUTER JOIN opdscreen s ON s.vn=o.vn
      LEFT OUTER JOIN rcpt_print r ON r.vn=o.vn
      LEFT OUTER JOIN visit_pttype vs ON vs.vn=v.vn
      LEFT OUTER JOIN nhso_ucae_type nc ON nc.nhso_ucae_type_code=vs.nhso_ucae_type_code
      LEFT OUTER JOIN sex ge ON ge.code=pt.sex
      LEFT OUTER JOIN pt_subtype ps ON ps.pt_subtype=o.pt_subtype
      LEFT OUTER JOIN ovstist ov ON ov.ovstist=o.ovstist
      LEFT OUTER JOIN referin rf ON rf.vn=v.vn
      LEFT OUTER JOIN referout ro ON ro.vn=v.vn
      LEFT OUTER JOIN patient_history_hpi ph ON ph.vn=o.vn
      LEFT OUTER JOIN kskdepartment k ON k.depcode=o.main_dep
      LEFT OUTER JOIN spclty sp ON sp.spclty=o.spclty
      LEFT OUTER JOIN hospcode h ON h.hospcode=v.hospmain
      LEFT OUTER JOIN hospcode h2 ON h2.hospcode=v.hospsub
      LEFT OUTER JOIN ovstost ovs ON ovs.ovstost=o.ovstost
      LEFT OUTER JOIN ovst_seq os ON os.vn=o.vn
      LEFT OUTER JOIN nationality n ON n.nationality=pt.nationality
      LEFT OUTER JOIN ovstdiag dx ON dx.vn=o.vn
      LEFT OUTER JOIN doctor d ON d.code=o.doctor
      LEFT OUTER JOIN rcmdb.repdata rd ON rd.vn=o.vn
      LEFT OUTER JOIN rcmdb.repeclaim re ON re.vn=o.vn
      LEFT OUTER JOIN eclaimdb.l_validatedata vl ON vl.CODE_ID=rd.ErrorCode
      LEFT OUTER JOIN fdh_claim_status fcs ON fcs.vn=o.vn
      LEFT OUTER JOIN fdh_claim_status_detail fcsd ON fcsd.fdh_claim_status_id=fcs.fdh_claim_status_id
      LEFT OUTER JOIN ovst_doctor_diag vd ON vd.vn=o.vn
      LEFT OUTER JOIN rcmdb.ktb kt ON kt.vn=o.vn
      LEFT OUTER JOIN rcmdb.repstatus rs ON rs.seq=o.vn
      LEFT OUTER JOIN nhso_confirm_privilege cp ON o.vn=cp.vn
      LEFT OUTER JOIN occupation oc ON oc.occupation=pt.occupation
      LEFT JOIN rcmdb.seamless se ON se.vn=o.vn
    WHERE o.vstdate BETWEEN ? AND ?
    ${pttypes.length > 0 ? `AND o.pttype IN (${pttypes.map(() => '?').join(',')})` : ''}
    GROUP BY o.vn
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
    console.error("OPD query error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
