public without sharing class contractorSharingHelper {
    
    @AuraEnabled(cacheable=true)
    public static List<Grant__c> getGrants() {
        return [
            SELECT Id, Name, Program_Group__c, CreatedDate
            FROM Grant__c
            ORDER BY CreatedDate
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<County__c> getCounties() {
        return [
            SELECT Id, Name, Region__c
            FROM County__c
            ORDER BY Name
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<User> getUsers() {
        return [
            SELECT Id, Name, Email
            FROM User
            WHERE Profile.Name = 'CP GMS Contractor Portal'
            ORDER BY Name
        ];
    }

    @AuraEnabled
    public static List<Subrecipient_Agreement__c> currentAccess(List<Id> userIds) {
        
        List<Subrecipient_Agreement__Share> shares = [
            SELECT ParentId, UserorGroupId
            FROM Subrecipient_Agreement__Share
            WHERE UserorGroupId IN : userIds
        ];

        List<Id> agreementIds = new List<Id>();

        for (Subrecipient_Agreement__Share s : shares) {
            agreementIds.add(s.ParentId);
        }

        List<Subrecipient_Agreement__c> subAgreements = [
            SELECT Id, Name, Grant__r.Name, County__r.Name
            FROM Subrecipient_Agreement__c
            WHERE Id IN : agreementIds
        ];

        return subAgreements;
    }

    @AuraEnabled
    public static Boolean createShares(List<Id> grantIds, List<Id> countyIds, List<Id> userIds) {

        List<User> users = [
            SELECT Id, Name
            FROM User
            WHERE Id IN : userIds
        ];

        List<Subrecipient_Agreement__c> subAgreements = [
            SELECT Id, Name, Grant__c, County__c
            FROM Subrecipient_Agreement__c
            WHERE Grant__c IN : grantIds
                AND County__c IN : countyIds
        ];

        List<Subrecipient_Agreement__Share> shares = new List<Subrecipient_Agreement__Share>();

        try {

            for (Subrecipient_Agreement__c sa : subAgreements) {

                for (User u : users) {
    
                    Subrecipient_Agreement__Share share =  new Subrecipient_Agreement__Share();  
                        share.ParentId      = sa.Id;
                        share.AccessLevel   = 'Edit';
                        share.UserorGroupId = u.Id;
                    shares.add(share);
                }
            }

            if (!shares.isEmpty()) {
                insert shares;
                return true;
            }

            return true;

        } catch (DmlException e) {

            System.debug('The following exception has occurred: ' + e.getMessage());
            return false;
        }
    }

    @AuraEnabled
    public static Boolean deleteShares(List<Id> grantIds, List<Id> countyIds, List<Id> userIds) {

        List<Subrecipient_Agreement__c> subAgreements = [
            SELECT Id, Name, Grant__c, County__c
            FROM Subrecipient_Agreement__c
            WHERE Grant__c IN : grantIds
                AND County__c IN : countyIds
        ];

        List<Id> subAgreementsIds = new List<Id>();

        for (Subrecipient_Agreement__c sa : subAgreements) {
            subAgreementsIds.add(sa.Id);
        }

        List<Subrecipient_Agreement__Share> sharesToDelete = [
            SELECT ParentId, UserorGroupId
            FROM Subrecipient_Agreement__Share
            WHERE ParentId IN : subAgreementsIds
                AND UserorGroupId IN : userIds
        ];
            
        try {

            if (!sharesToDelete.isEmpty()){
                delete sharesToDelete;
                return true;
            }

            return true;

        } catch (DmlException e) {
            System.debug('The following exception has occurred: ' + e.getMessage());
            return false;
        }
    }
}