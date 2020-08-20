@isTest
private class contractorSharingHelperTest {
    
    private static testmethod void test1(){
        
        Grant__c g = new Grant__c();
            g.Name = 'New Grant';
        insert g;

        County__c county = new County__c();
            county.Name = 'Flagler';
        insert county;

        Subrecipient_Agreement__c sa = new Subrecipient_Agreement__c();
            sa.County__c    = county.Id;
            sa.Grant__c     = g.Id;
        insert sa;

        Account a = new Account();
            a.Name = 'Pearl';
        insert a;

        Contact c = new Contact();
            c.LastName = 'Sparrow';
            c.AccountId = a.Id;
        insert c;

        Id p = [SELECT Id FROM profile WHERE Name = 'CP GMS Contractor Portal'].Id;

        User u = new User();
            u.alias                 = 'jack';
            u.email                 = 'jacksparrow@blackpearl.car';
            u.emailencodingkey      = 'UTC-8';
            u.LastName              = 'Sparrow';
            u.LanguageLocaleKey     = 'en_US';
            u.LocaleSIDKey          = 'en_US';
            u.ProfileId             = p;
            u.Country               = 'United States';
            u.IsActive              = true;
            u.ContactId             = c.Id;
            u.TimeZoneSIDKey        = 'America/Los_Angeles';
            u.EmailEncodingKey      = 'ISO-8859-1';
            u.UserName              = 'jacksparrow@blackpearl.car';
        insert u;

        List<Grant__c> gTest = contractorSharingHelper.getGrants();
        system.assertNotEquals(null, gTest.size());

        List<County__c> countyTest = contractorSharingHelper.getCounties();
        system.assertNotEquals(null, countyTest.size());

        List<User> usersTest = contractorSharingHelper.getUsers();
        system.assertNotEquals(null, usersTest.size());

        List<Id> grantIds = new List<Id>();
            grantIds.add(g.Id);

        List<Id> countyIds = new List<Id>();
            countyIds.add(county.Id);

        List<Id> uids = new List<Id>();
            uids.add(u.Id);
        
        Boolean shares = contractorSharingHelper.createShares(grantIds, countyIds, uids);
        system.assertEquals(true, shares);

        List<Subrecipient_Agreement__c> access = contractorSharingHelper.currentAccess(uids);
        system.assertNotEquals(null, access.size());

        Boolean deleted = contractorSharingHelper.deleteShares(grantIds, countyIds, uids);
        system.assertEquals(true, deleted);

        delete sa;

        contractorSharingHelper.createShares(grantIds, countyIds, uids);
        contractorSharingHelper.deleteShares(grantIds, countyIds, uids);
    }

}