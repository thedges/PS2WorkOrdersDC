public with sharing class PS2WorkOrdersDCController
{
    public PS2WorkOrdersDCController()
    {
    }

    // PS2WorkOrdersDCController.getWorkOrders();
    @AuraEnabled
    public static String getWorkOrders()
    {
        String contactId = '003bn0000064t0sAAA';
    
        User u = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId()];
        if (u != null && u.ContactId != null)
        {
            contactId = u.ContactId;
        }

        // Define the endpoint and the body
        String endpoint = '/services/data/v61.0/ssot/queryv2';
        String body = '{"sql": "SELECT customer_id__c, DataSource__c, DataSourceObject__c, date_created__c, date_modified__c, InternalOrganization__c, status__c, subject__c, workorder_id__c ' +
                      'FROM PublicWorks_Work_Orders__dlm ' +
                      'WHERE customer_id__c in (SELECT SourceRecordId__c from UnifiedLinkssotIndividualCcid__dlm WHERE ssot__DataSourceObjectId__c = \'HerokuPostgres_JH_Heroku_Postgres_dfd_customer_publicworks\' ' +
                      'and UnifiedRecordId__c IN (SELECT UnifiedRecordId__c FROM UnifiedLinkssotIndividualCcid__dlm WHERE SourceRecordId__c = \'' + contactId + '\'))"}';

        // Create the HTTP request
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Local_Data_Cloud' + endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(body);

        // Send the request
        Http http = new Http();
        HttpResponse res = http.send(req);

        // Process the response
        if (res.getStatusCode() == 201)
        {
            System.debug('UserId = ' + UserInfo.getUserId());
            System.debug('Response: ' + JSON.serializePretty(JSON.deserializeUntyped(res.getBody())));
            return res.getBody();
        } else
        {
            System.debug('Error: ' + res.getStatusCode() + ' ' + res.getStatus());
            return 'Error: ' + res.getStatusCode() + ' ' + res.getStatus();
        }
    }

}