# Introduction 
Custom MailEtaer for Ivanti ServiceManager

# Getting Started
    1. Apply Packages:
	    1.1 XSC_MailEaterBase V2.MetadataPatch
	    1.2 XSC_MailEaterBase V2 External.MetadataPatch
	    1.3 XSC_MailEaterIncident V2.MetadataPatch
	    1.4 XSC_MailEaterServiceReq V2.MetadataPatch
	    1.5 XSC_MailEaterChange V2.MetadataPatch
	    1.6 XSC_MailEaterApprovalVote V2.MetadataPatch
	    1.7 XSC_MailEaterAssignment V2.MetadataPatch
	    1.8 XSC_MailEaterWorkOrder V2.MetadataPatch
    2. Add "XSC_No_Action.xsl" as Additional XSL to "XSC_Email" Data Import Connection
    3. Configure mailbox (Email Processor - "ExportEmailAsXml", Data Import Connection - "XSC_Email")
    4. In Global Constant "XSC MailEater From Address" change value to Email Listener Address
    5. Add Quick Actions to Journal.Email
    6. Add Custom Object Name Mapping
    7. Add Task Assignment Status Keywords (Optional)
    8. Add Task WorkOrder Status Keywords (Optional)
    9. Add FRS Approval Status Keywords (Optional)
