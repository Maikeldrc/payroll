export const MONTHLY_RECORD_HEADERS = [
  "MRN", "Patient", "First Name", "Last Name", "Sex", "Date of Birth", "Provider", "Care Manager",
  "Service", "Conditions", "ICD-10s", "Codes", "Month Of", "Log Entries", "Monthly Billing", "Measured Days",
  "Last Modification Time", "Latest Interactive Communication", "Primary Insurance Name", "Primary Policy Number",
  "Secondary Insurance Name", "Secondary Policy Number", "Address", "Eligibility", "HMO",
  "Code1", "Code2", "Code3", "Code4", "Code5", "Code6",
  "Record ID", "Reporting Period", "Import Batch ID", "Source File Name", "Source Row Number", "Source File Hash",
  "Source Row Hash", "Imported At", "Imported By", "Organization ID", "Practice ID", "Provider Normalized ID",
  "Care Manager Normalized ID", "Service Normalized ID", "Record Status", "Duplicate Status", "Validation Status",
  "Data Quality Status", "Payroll Inclusion Status", "Last Updated At", "Record Version",
] as const;

export const RECORD_CODE_HEADERS = [
  "Record Code ID", "Record ID", "Reporting Period", "Code", "Code Position", "Source Field",
  "Import Batch ID", "Validation Status", "Created At",
] as const;

export const IMPORT_BATCH_HEADERS = [
  "Import Batch ID", "Reporting Period", "Original File Name", "File Hash", "File Size", "Imported At", "Imported By",
  "Total Rows", "Valid Rows", "Warning Rows", "Rejected Rows", "Exact Duplicate Rows", "Possible Duplicate Rows",
  "Updated Rows", "Providers Detected", "Care Managers Detected", "Services Detected", "Codes Detected", "Import Status",
  "Processing Started At", "Processing Completed At", "Failure Step", "Failure Reason", "Retry Count",
] as const;

export const DATA_QUALITY_HEADERS = [
  "Finding ID", "Reporting Period", "Record ID", "Import Batch ID", "Finding Type", "Severity", "Field", "Description",
  "Original Value", "Suggested Value", "Corrected Value", "Resolution Status", "Resolution Reason", "Resolved By",
  "Resolved At", "Created At",
] as const;

export const MONTHLY_KPI_HEADERS = [
  "Reporting Period", "Organization ID", "Practice ID", "Provider ID", "Care Manager ID", "Service ID", "Metric ID",
  "Metric Name", "Numerator", "Denominator", "Metric Value", "Metric Type", "Calculation Version", "Calculated At",
] as const;

export const PAYROLL_SUMMARY_HEADERS = [
  "Reporting Period", "Care Manager ID", "Care Manager Display Name", "Approved Working Hours", "Hourly Rate",
  "Base Payroll", "Bonuses", "Deductions", "Manual Adjustments", "Final Payroll", "Payroll Status",
  "Calculation Version", "Approved By", "Approved At", "Closed At",
] as const;

export const MONTHLY_CLOSE_HEADERS = [
  "Reporting Period", "Status", "Record Count", "Unique Active Patients", "Unique Billable Patients", "Total Billing",
  "Direct Revenue", "Total Attributed Revenue", "Final Payroll", "Open Critical Findings", "Open Warnings",
  "Import Batch Count", "Calculation Version", "Closed By", "Closed At", "Reopened By", "Reopened At",
  "Reopening Reason", "Close Version", "Notes",
] as const;

export const MONTHLY_SHEETS = {
  Monthly_Records: MONTHLY_RECORD_HEADERS,
  Record_Codes: RECORD_CODE_HEADERS,
  Import_Batches: IMPORT_BATCH_HEADERS,
  Data_Quality_Findings: DATA_QUALITY_HEADERS,
  Monthly_KPIs: MONTHLY_KPI_HEADERS,
  Payroll_Summary: PAYROLL_SUMMARY_HEADERS,
  Monthly_Close: MONTHLY_CLOSE_HEADERS,
} as const;

export const MONTHLY_FILE_INDEX_HEADERS = [
  "Reporting Period", "Year", "Month", "Drive Folder ID", "Spreadsheet ID", "Spreadsheet Name", "Status",
  "Record Count", "Import Batch Count", "First Import At", "Last Import At", "Created By", "Last Updated At",
] as const;

export const MASTER_SHEETS = {
  Monthly_File_Index: MONTHLY_FILE_INDEX_HEADERS,
  Monthly_Closures: ["Reporting Period", "Spreadsheet ID", "Close Status", "Close Version", "Record Count", "Unique Patients", "Unique Billable Patients", "Total Billing", "Direct Revenue", "Total Attributed Revenue", "Final Payroll", "Open Critical Findings", "Closed By", "Closed At"],
  Care_Manager_Monthly_Performance: ["Reporting Period", "Care Manager ID", "Care Manager Display Name", "Service", "Active Patients", "Unique Patients", "Billable Patients", "Billable Rate", "Documented Hours", "Declared Hours", "Utilization", "Revenue", "Payroll", "Performance Score", "Data Quality Score"],
  Provider_Monthly_Performance: ["Reporting Period", "Practice ID", "Provider ID", "Provider Display Name", "Service", "Active Patients", "Billable Patients", "Billing", "Revenue", "Data Quality Score"],
  Service_Monthly_Performance: ["Reporting Period", "Service ID", "Patient-Service Records", "Unique Patients", "Billable Patients", "Billable Rate", "Base Code Units", "Add-On Units", "Billing", "Revenue"],
  Payroll_History: ["Reporting Period", "Care Manager ID", "Payroll Version", "Base Payroll", "Bonuses", "Deductions", "Adjustments", "Final Payroll", "Status", "Approved By", "Closed At"],
  Data_Quality_Summary: ["Reporting Period", "Critical Findings", "Warnings", "Informational Findings", "Resolved Findings", "Open Findings", "Data Quality Score"],
} as const;
