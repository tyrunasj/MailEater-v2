var CurrentJournal = Get("Journal#Email", "$(RecId)");
var CurrentJournalFromAddr = CurrentJournal.Fields["FromAddr"];
var CurrentJournalSubject = CurrentJournal.Fields["Subject"];
var RelatedTicket = null;
var evaluate = true;
//variables for update
var journalCreatedBy;
var journalOwner;
var journalXSC_InitialOwnerExists;
var journalEmailBodyType;
var journalXSC_BodyPlain;
var journalParentLink_RecID = null;
var journalParentLink_Category = null;;
var journalXSC_InternalTicketID = null;
var journalXSC_InternalTicketType = null;
var journalParentOwner;
var journalIsUnRead;
var journalXSC_ExternalTicketID = null;
var journalXSC_ExternalTicketType = null;
var journalXSC_ParentInfo;


var CurrentUser = Get('Employee#', '$(CurrentUserRecId())');
var wsUrl = '$(SecureServerURL())/ServiceAPI/FRSHEATIntegration.asmx?wsdl';
var wsInstance = GetWebServiceFromUrl(wsUrl, "FRSHEATIntegration", null, null);
var ApplicationID = CurrentUser.SessionContext.ApplicationID();
var SessionKey = CurrentUser.SessionContext.SessionKey();

if (CurrentJournal.Fields["LastSendMailError"] != "Email with subject matching ignored list")
{
	///Set owner by Email "From"
	var CurrentJournalEmployee = Get("Employee#", "PrimaryEmail", CurrentJournalFromAddr);
	if(CurrentJournalEmployee != null){
		journalCreatedBy = CurrentJournalEmployee.Fields["LoginID"];
		journalOwner = CurrentJournalEmployee.Fields["LoginID"];
		journalOwnerEmail = CurrentJournalEmployee.Fields["PrimaryEmail"];
		journalXSC_InitialOwnerExists = true;
		
	} else {
		journalCreatedBy = "InternalServices";
		journalOwner = "InternalServices";
		journalOwnerEmail = "InternalServices";
		journalXSC_InitialOwnerExists = false;
	}

	if(CurrentJournal.Fields["EmailBody"].indexOf('content="text/html') == -1){
		journalEmailBodyType = "Text"
	}
	else
	{
		journalEmailBodyType = "HTML"
	}
	///Strip HTML and put in XSC_BodyPlain
	if(journalEmailBodyType != "HTML" && !new RegExp("^<.*?>.*").test(CurrentJournal.Fields["EmailBody"])){
		journalXSC_BodyPlain = CurrentJournal.Fields["EmailBody"];
	} else {
		var stripped = HeatUtility.HtmlDecode(CurrentJournal.Fields["EmailBody"]);
		stripped = stripped.replace(/[\r\n]{1,1}/gmi, '').replace(/<style.*?>.*?<\/style>/gmi, '').replace(/<(br|tr|p).*?>/gmi, '\n').replace(/<(?:.|\n)*?>/gm, '').replace(/[ ]{2,100}/gmi, ' ').replace(/[\n ]{2,100}/gmi, '\n');
		journalXSC_BodyPlain = stripped;
	}
		console.debug("CurrentJournalSubject: " + CurrentJournalSubject);	
		var EmailBOMapping = null;
		var result = Search('XSC_TenantEmailBONameMapping#').Where({XSC_3rdParty: false});
		console.debug("Got results for XSC_TenantEmailBONameMapping# Where({XSC_3rdParty: false})");
		var mappingFound = false;
		while (result.MoveNext()) {	
			EmailBOMapping = result.Current;
			
			console.debug('matches pattern: [ ]{0,1}[a-zA-Z0-9]{1,50}' + EmailBOMapping.Fields["XSC_Separator"] + '[0-9]{3,20}[ ]{0,1}');
			var matchesRegex = new RegExp('[ ]{0,1}[a-zA-Z0-9]{1,50}' + EmailBOMapping.Fields["XSC_Separator"] + '[0-9]{3,20}[ ]{0,1}', 'g');
			var matches = CurrentJournalSubject.match(matchesRegex);
			console.debug("typeof matches = " + typeof matches);
			console.debug("matches: " + matches);
			if(matches == null){
				continue;
			}
			console.debug("HEAT matches.length: " + matches.length);
			var splitRegExp = new RegExp(EmailBOMapping.Fields["XSC_Separator"]);
			for(var i = 0; i < matches.length; i++){
				var matchestrimmed = matches[i].trim();
				var ticketType = matchestrimmed.split(splitRegExp)[0].trim();
				var ticketNumber = matchestrimmed.split(splitRegExp)[1].trim();
				console.debug("ticketType: " + ticketType);
				console.debug("ticketNumber: " + ticketNumber);
			
				var SearchField = EmailBOMapping.Fields["TargetBOName"] + "Number";
				if(EmailBOMapping.Fields["XSC_SearchField"] != null){
					SearchField = EmailBOMapping.Fields["XSC_SearchField"];
				}
				console.debug("SourceBOName:" + EmailBOMapping.Fields["SourceBOName"]);
				console.debug("TargetBOName:" + EmailBOMapping.Fields["TargetBOName"]);
				if(ticketType == EmailBOMapping.Fields["SourceBOName"]){
					if(EmailBOMapping.Fields["TargetBOName"].indexOf(".") > -1)
					{
						RelatedTicket = Get(EmailBOMapping.Fields["TargetBOName"].replace(".","#"), SearchField, ticketNumber);
					}
					else
					{
						RelatedTicket = Get(EmailBOMapping.Fields["TargetBOName"] + "#", SearchField, ticketNumber);
					}
					if(RelatedTicket != null){
						console.debug("RelatedTicket.Fields['RecId']:" + RelatedTicket.Fields["RecId"]);
						journalParentLink_RecID = RelatedTicket.Fields["RecId"];
						journalParentLink_Category = EmailBOMapping.Fields["TargetBOName"];
						journalXSC_ParentInfo = RelatedTicket.Fields["RecId"]+"|"+EmailBOMapping.Fields["TargetBOName"]+"|";
						journalXSC_InternalTicketID = ticketNumber;
						journalXSC_InternalTicketType = EmailBOMapping.Fields["SourceBOName"];
						journalParentOwner = RelatedTicket.Fields["Owner"];
						
						mappingFound = true;
						break;
					}
				}
			}
			if(mappingFound){
				break;
			}
		}
		result.Close();
		console.debug('------------------------------------------------------');
		if(!mappingFound){
			EmailBOMapping = null;
			result = Search('XSC_TenantEmailBONameMapping#').Where({XSC_3rdParty: true});
			mappingFound = false;
			while (result.MoveNext()) {
				EmailBOMapping = result.Current;
				
				console.debug('matches pattern: [ ]{0,1}[a-zA-Z0-9]{1,50}' + EmailBOMapping.Fields["XSC_Separator"] + '[0-9]{3,20}[ ]{0,1}');
				var matchesRegex = new RegExp('[ ]{0,1}[a-zA-Z0-9]{1,50}' + EmailBOMapping.Fields["XSC_Separator"] + '[0-9]{3,20}[ ]{0,1}', 'g');
				var matches = CurrentJournalSubject.match(matchesRegex);
				console.debug("typeof matches = " + typeof matches);
				console.debug("matches: " + matches);
				if(matches == null){
					continue;
				}
				console.debug("Non_HEAT matches.length: " + matches.length);
				var splitRegExp = new RegExp(EmailBOMapping.Fields["XSC_Separator"]);
				for(var i = 0; i < matches.length; i++){
					var matchestrimmed = matches[i].trim();
					var ticketType = matchestrimmed.split(splitRegExp)[0].trim();
					var ticketNumber = matchestrimmed.split(splitRegExp)[1].trim();
					console.debug("ticketType: " + ticketType);
					console.debug("ticketNumber: " + ticketNumber);
					
					var SearchField = EmailBOMapping.Fields["TargetBOName"] + "Number";
					if(EmailBOMapping.Fields["XSC_SearchField"] != null){
						SearchField = EmailBOMapping.Fields["XSC_SearchField"];
					}
					console.debug("SourceBOName:" + EmailBOMapping.Fields["SourceBOName"]);
					console.debug("TargetBOName:" + EmailBOMapping.Fields["TargetBOName"]);
					if(ticketType == EmailBOMapping.Fields["SourceBOName"]){
						journalXSC_ExternalTicketID = ticketNumber;
						journalXSC_ExternalTicketType = EmailBOMapping.Fields["SourceBOName"];
						if(EmailBOMapping.Fields["TargetBOName"].indexOf(".") > -1)
						{
							RelatedTicket = Get(EmailBOMapping.Fields["TargetBOName"].replace(".","#"), SearchField, ticketNumber);
						}
						else
						{
							RelatedTicket = Get(EmailBOMapping.Fields["TargetBOName"] + "#", SearchField, ticketNumber);
						}
						if(RelatedTicket != null){
							console.debug("RelatedTicket.Fields['RecId']:" + RelatedTicket.Fields["RecId"]);
							if(CurrentJournal.Fields["ParentLink_RecID"] == null || CurrentJournal.Fields["ParentLink_RecID"].length == 0){
								journalParentLink_RecID = RelatedTicket.Fields["RecId"];
								journalParentLink_Category = EmailBOMapping.Fields["TargetBOName"];
								journalXSC_ParentInfo = RelatedTicket.Fields["RecId"]+"|"+EmailBOMapping.Fields["TargetBOName"]+"|";
								journalParentOwner = RelatedTicket.Fields["Owner"];
							}
							mappingFound = true;
							break;
						}
					}
				}
				if(mappingFound){
					break;
				}
			}
			result.Close();
		}
		// ISUnread evaluation
		if(!mappingFound){
			journalIsUnRead = 1;
		} else {
		
			if(RelatedTicket != null && (journalOwner == RelatedTicket.Fields["Owner"] || journalOwnerEmail == RelatedTicket.Fields["Owner"])){
				journalIsUnRead = 0;
			} else {
				journalIsUnRead = 1;
			}
		}
		console.debug("Updating Journal");
		//TODO: Migrate to  Integration Web Service
		/*CurrentJournal.Update({
					CreatedBy:journalCreatedBy,
					Owner:journalOwner,
					XSC_InitialOwnerExists:journalXSC_InitialOwnerExists,
					EmailBodyType:journalEmailBodyType,
					XSC_BodyPlain:journalXSC_BodyPlain,
					ParentLink_RecID:journalParentLink_RecID,
					ParentLink_Category:journalParentLink_Category,
					XSC_InternalTicketID:journalXSC_InternalTicketID,
					XSC_InternalTicketType:journalXSC_InternalTicketType,
					ParentOwner:journalParentOwner,
					XSC_ExternalTicketType:journalXSC_ExternalTicketType,
					XSC_ExternalTicketID:journalXSC_ExternalTicketID,
					IsUnRead:journalIsUnRead	
				});*/
		//TODO: Migrate to  Integration Web Service
		var UpdateJournalStatus;		
		UpdateJournalStatus = wsInstance.InvokeMethod("UpdateObject", [ SessionKey, ApplicationID, {ObjectType:'Journal#Email', ObjectId: "$(RecId)", Fields:[{Name: 'CreatedBy', Value: journalCreatedBy}, {Name: 'Owner', Value: journalOwner}, {Name: 'XSC_InitialOwnerExists', Value: journalXSC_InitialOwnerExists}, {Name: 'EmailBodyType', Value: journalEmailBodyType}, {Name: 'XSC_BodyPlain', Value: journalXSC_BodyPlain}, {Name: 'XSC_InternalTicketID', Value: journalXSC_InternalTicketID}, {Name: 'XSC_InternalTicketType', Value: journalXSC_InternalTicketType}, {Name: 'ParentOwner', Value: journalParentOwner}, {Name: 'XSC_ExternalTicketType', Value: journalXSC_ExternalTicketType}, {Name: 'XSC_ExternalTicketID', Value: journalXSC_ExternalTicketID}, {Name: 'IsUnRead', Value: journalIsUnRead}, {Name: 'ParentLink_RecID', Value: journalParentLink_RecID}, {Name: 'ParentLink_Category', Value: journalParentLink_Category}]}]);
		
		
		if (UpdateJournalStatus.status == "Success" )
		{
			console.debug("UpdateJournalStatus response: " + UpdateJournalStatus.status);
		}
		else if (UpdateJournalStatus.exceptionReason.indexOf("because the object is in final state") > -1)
		{
			mappingFound = false;
			console.info("Related object is in final state. Updating without linkink to the parent object");
			UpdateJournalStatus = wsInstance.InvokeMethod("UpdateObject", [ SessionKey, ApplicationID, {ObjectType:'Journal#Email', ObjectId: "$(RecId)", Fields:[{Name: 'CreatedBy', Value: journalCreatedBy}, {Name: 'Owner', Value: journalOwner}, {Name: 'XSC_InitialOwnerExists', Value: journalXSC_InitialOwnerExists}, {Name: 'EmailBodyType', Value: journalEmailBodyType}, {Name: 'XSC_BodyPlain', Value: journalXSC_BodyPlain}, {Name: 'XSC_InternalTicketID', Value: journalXSC_InternalTicketID}, {Name: 'XSC_InternalTicketType', Value: journalXSC_InternalTicketType}, {Name: 'ParentOwner', Value: journalParentOwner}, {Name: 'XSC_ExternalTicketType',Value: journalXSC_ExternalTicketType}, {Name: 'XSC_ExternalTicketID', Value: journalXSC_ExternalTicketID}, {Name: 'IsUnRead', Value: journalIsUnRead}]}]);
			if (UpdateJournalStatus.status == "Success" )
			{
				console.debug("UpdateJournalStatus response: " + UpdateJournalStatus.status);
			}
			else
			{
				console.error(UpdateJournalStatus);
			}
		}
		else
		{
			console.error(UpdateJournalStatus);
			mappingFound = false;
		}

		if(mappingFound){	
			console.debug("KeywordMapping for: " + journalParentLink_Category);
			var KeywordMapping = null;
			var found_keyword = "";
			var keywordsResult = null;
			var keywordFoundInMapping = false;
			var setTicketStatusTo = "";
			var UpdateRelatedTicketStatus ="";
			if(journalParentLink_Category == "FRS_ApprovalVoteTracking" && journalOwnerEmail == RelatedTicket.Fields["Owner"]){
				console.debug("FRS_ApprovalVoteTracking: found");
				console.debug("message: " + journalXSC_BodyPlain);
				found_keyword = journalXSC_BodyPlain.match(/^\s*([a-zA-Z0-9]+)/)[1].toLowerCase();
				console.debug("found_keyword: " + found_keyword);		
				keywordsResult = Search('TenantEmailFRSApprovalKeyword#');
				
				while (keywordsResult.MoveNext()) {
					KeywordMapping = keywordsResult.Current;
					console.debug("StatusKeyword:" + KeywordMapping.Fields["StatusKeyword"]);
					console.debug("FRSApprovalStatus:" + KeywordMapping.Fields["FRSApprovalStatus"]);
					if(found_keyword == KeywordMapping.Fields["StatusKeyword"].toLowerCase()){
						console.debug("Set status:" + KeywordMapping.Fields["FRSApprovalStatus"]);
						keywordFoundInMapping = true;
						setTicketStatusTo = KeywordMapping.Fields["FRSApprovalStatus"];
						break;
					}
				}
				keywordsResult.Close();
				if(keywordFoundInMapping){
					/*RelatedTicket.Update({
						Status:setTicketStatusTo,
						Reason:"Status was changed by email: " + journalXSC_BodyPlain,
						VotedBy:CurrentJournalEmployee.Fields["LoginID"]
					});
					*/
					approvalReason = "Status was changed by email: " + journalXSC_BodyPlain;
					//need to update VotedBy before-save rule
					UpdateRelatedTicketStatus = wsInstance.InvokeMethod("UpdateObject", [ SessionKey, ApplicationID, {ObjectType:'FRS_ApprovalVoteTracking#', ObjectId: RelatedTicket.Fields["RecId"]  , Fields:[{Name: 'Status', Value: setTicketStatusTo}, {Name: 'Reason', Value: approvalReason}, {Name: 'VotedBy', Value: CurrentJournalEmployee.Fields["LoginID"]}]}]);
						if (UpdateRelatedTicketStatus.status == "Success" )
						{
							console.debug("UpdateRelatedTicketStatus response: " + UpdateRelatedTicketStatus.status);
						}
						else
						{
							console.error(UpdateRelatedTicketStatus);
						}
					
				}
			}
			if(journalParentLink_Category == "Task.Assignment"){
				console.debug("Task.Assignment: found");
				console.debug("message: " + journalXSC_BodyPlain);
				found_keyword = journalXSC_BodyPlain.match(/^\s*([a-zA-Z0-9]+)/)[1].toLowerCase();
				console.debug("found_keyword: " + found_keyword);		
				keywordsResult = Search('TenantEmailTaskAssignmentKeyword#');
				while (keywordsResult.MoveNext()) {
					KeywordMapping = keywordsResult.Current;
					console.debug("StatusKeyword:" + KeywordMapping.Fields["StatusKeyword"]);
					console.debug("Assignment:" + KeywordMapping.Fields["TaskAssignmentStatus"]);
					if(found_keyword == KeywordMapping.Fields["StatusKeyword"].toLowerCase()){
						console.debug("Set status:" + KeywordMapping.Fields["TaskAssignmentStatus"]);
						keywordFoundInMapping = true;
						setTicketStatusTo = KeywordMapping.Fields["TaskAssignmentStatus"];
						break;
					}
				}
				keywordsResult.Close();
				if(keywordFoundInMapping){
					/*RelatedTicket.Update({
						Status:setTicketStatusTo,
						Owner:CurrentJournalEmployee.Fields["LoginID"]
					});
					*/
					approvalReason = "Status was changed by email: " + journalXSC_BodyPlain;
					UpdateRelatedTicketStatus = wsInstance.InvokeMethod("UpdateObject", [ SessionKey, ApplicationID, {ObjectType:'Task#Assignment', ObjectId: RelatedTicket.Fields["RecId"]  , Fields:[{Name: 'Status', Value: setTicketStatusTo}, {Name: 'Owner', Value: CurrentJournalEmployee.Fields["LoginID"]}]}]);
						if (UpdateRelatedTicketStatus.status == "Success" )
						{
							console.debug("UpdateRelatedTicketStatus response: " + UpdateRelatedTicketStatus.status);
						}
						else
						{
							console.error(UpdateRelatedTicketStatus);
						}
					
				}
			
			}
			
			if(journalParentLink_Category == "Task.WorkOrder"){
				console.debug("Task.WorkOrder: found");
				console.debug("message: " + journalXSC_BodyPlain);
				found_keyword = journalXSC_BodyPlain.match(/^\s*([a-zA-Z0-9]+)/)[1].toLowerCase();
				console.debug("found_keyword: " + found_keyword);		
				keywordsResult = Search('XSC_TenantEmailTaskWorkOrderKeyword#');
				while (keywordsResult.MoveNext()) {
					KeywordMapping = keywordsResult.Current;
					console.debug("StatusKeyword:" + KeywordMapping.Fields["StatusKeyword"]);
					console.debug("WorkOrder Status:" + KeywordMapping.Fields["TaskWorkOrderStatus"]);
					if(found_keyword == KeywordMapping.Fields["StatusKeyword"].toLowerCase()){
						console.debug("Set status:" + KeywordMapping.Fields["TaskWorkOrderStatus"]);
						keywordFoundInMapping = true;
						setTicketStatusTo = KeywordMapping.Fields["TaskWorkOrderStatus"];
						break;
					}
				}
				keywordsResult.Close();
				if(keywordFoundInMapping){
					/*RelatedTicket.Update({
						Status:setTicketStatusTo,
					});
					*/
					approvalReason = "Status was changed by email: " + journalXSC_BodyPlain;
					UpdateRelatedTicketStatus = wsInstance.InvokeMethod("UpdateObject", [ SessionKey, ApplicationID, {ObjectType:'Task#WorkOrder', ObjectId: RelatedTicket.Fields["RecId"]  , Fields:[{Name: 'Status', Value: setTicketStatusTo}]}]);
						if (UpdateRelatedTicketStatus.status == "Success" )
						{
							console.debug("UpdateRelatedTicketStatus response: " + UpdateRelatedTicketStatus.status);
						}
						else
						{
							console.error(UpdateRelatedTicketStatus);
						}
					
				}
			
			}
		}
}
else
{
	var UpdateJournalStatus = wsInstance.InvokeMethod("UpdateObject", [ SessionKey, ApplicationID, {ObjectType:'Journal#Email', ObjectId: "$(RecId)", Fields:[{Name: 'IsUnRead', Value: journalIsUnRead}, {Name: 'XSC_Spam', Value: 1}]}]);
}	

console.debug("XSC Script Completed");

