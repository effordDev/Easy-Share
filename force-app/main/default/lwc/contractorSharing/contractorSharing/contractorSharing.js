import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getGrants from '@salesforce/apex/contractorSharingHelper.getGrants';
import getCounties from '@salesforce/apex/contractorSharingHelper.getCounties';
import getUsers from '@salesforce/apex/contractorSharingHelper.getUsers';
import getGroups from '@salesforce/apex/contractorSharingHelper.getContractorGroups'
import getGroupedUsers from '@salesforce/apex/contractorSharingHelper.getGroupedUsers'
import currentAccess from '@salesforce/apex/contractorSharingHelper.currentAccess';
import availableAgreements from '@salesforce/apex/contractorSharingHelper.availableAgreements';

import createShares from '@salesforce/apex/contractorSharingHelper.createShares';
import createGroup from '@salesforce/apex/contractorSharingHelper.createGroup'
import addMember from '@salesforce/apex/contractorSharingHelper.addMember'

import deleteShares from '@salesforce/apex/contractorSharingHelper.deleteShares';
import deleteGroups from '@salesforce/apex/contractorSharingHelper.deleteGroups';
import deleteMembers from '@salesforce/apex/contractorSharingHelper.deleteMembers';

export default class ContractorSharing extends LightningElement {

    @track grantColumns = [{ 
        label: 'Grants', 
        fieldName: 'Name', 
        type: 'text' 
    }, {
        label: 'Program', 
        fieldName: 'Program_Group__c', 
        type: 'text' 
    }];

    @track countyColumns = [{ 
        label: 'Name', 
        fieldName: 'Name', 
        type: 'text',
        sortable: true
    }, {
        label: 'Region',
        fieldName: 'Region__c',
        type: 'text',
        sortable: true
    }];

    @track groupColumns = [{ 
        label: 'Group', 
        fieldName: 'Name', 
        type: 'text' 
    }];

    @track userColumns = [{ 
        label: 'Name', 
        fieldName: 'Name', 
        type: 'text' 
    }, {
        label: 'Email',
        fieldName: 'Email',
        type: 'text'
    }];

    @track agreementColumns = [{ 
        label: 'Name', 
        fieldName: 'Name', 
        type: 'text' 
    }, {
        label: 'Grant',
        fieldName: 'grantName',
        type: 'text'
    }, {
        label: 'County',
        fieldName: 'countyName',
        type: 'text'
    }];

    @track currentAccessColumns = [{ 
        label: 'Name', 
        fieldName: 'Name', 
        type: 'text' 
    }, {
        label: 'Grant',
        fieldName: 'grantName',
        type: 'text'
    }, {
        label: 'County',
        fieldName: 'countyName',
        type: 'text'
    }];

    @track disabled = false

    @track grants = []
    @track counties = []
    @track users = []
    @track groups = []
    @track groupedUsers = []
    @track agreements = []
    @track currentAccess = []

    @track _selectedGrants = []
    @track _selectedCounties = []
    @track _selectedUsers = []
    @track _selectedGroupedUsers = []
    @track _selectedGroups = []
    @track _selectedAgreements = []

    @track selectedRows

    @track contractorGroupName = ''

    @track sortBy ='Name';
    @track sortDirection = 'asc';

    @track loading = false
    @track disableDeleteGroupButton = true
    @track disableRemoveShareButton = true
    @track disableShareButton = true
    @track disableRemoveUserButton = true
    @track disableAddUserButton = true

    @track showAddUser = false
    @track showCreateGroup = false

    async connectedCallback() {

        this.grants = await getGrants();

        // this.counties = await getCounties();
        let result = await getCounties();
        result = JSON.parse(JSON.stringify(result));
        result = result.map(item => {

            item.Region__c = item.Region__c != null ? item.Region__c : '0'
            return item
        })

        this.counties = [...result]

        this.users = await getUsers();
        this.groups = await getGroups();

    }

    async getAvailableAgreements() {

        if ((!this._selectedGrants.length) || (!this._selectedCounties.length)) {
            return
        }
        this.startLoading()

        const result = await availableAgreements({grantIds: this._selectedGrants, countyIds: this._selectedCounties})

        this.agreements = result.map(item => {
            item.grantName = item.Grant__r.Name
            item.countyName = item.County__r.Name
            return item
        })

        this.endLoading()
    }

    async agreementShares(event) {

        this.startLoading()
        this.disabled = true

        let e = false

        if (!this._selectedAgreements.length) {
            this.errorToast('Please Select a Agreement(s)')
            e = true
        }

        if (!this._selectedGroups.length) {
            this.errorToast('Please Select a Group(s)')
            e = true
        }

        if (e) {
            this.disabled = false
            this.endLoading()
            return
        }        

        try {
            const result = await createShares({ agreementIds: this._selectedAgreements, groupIds: this._selectedGroups})

            if (result) {

                this.tastyToast('Success')

            } else {

                this.errorToast('Error Creating Shares')

            }

            this.getCurrentAccess()

            this.disabled = false
            this.endLoading()

        } catch (error) {

            this.errorToast('Error Creating Shares')

        }

    }

    async deleteShares(event) {

        this.startLoading()
        this.disabled = true

        let e = false

        if (!this._selectedGroups.length) {
            this.errorToast('Please Select a Group(s)')
            e = true
        }

        if (!this._selectedAgreements.length) {
            this.errorToast('Please Select a an Agreement(s)')
            e = true
        }

        if (e) {
            this.disabled = false
            this.endLoading()
            return
        }

        try {
            const result = await deleteShares({ groupIds: this._selectedGroups, agreementIds: this._selectedAgreements})

            if (result) {

                this.tastyToast('Success')

            } else {

                this.errorToast('Error Deleting Shares')

            }

            this.getCurrentAccess()

            this.disabled = false
            this.endLoading()

        } catch (error) {

            this.errorToast('Error Deleting Shares')

        }

    }

    getSelectedGrants(event) {
        const selected = event.detail.selectedRows

        this._selectedGrants = []

        for (let s of selected) {
            this._selectedGrants.push(s.Id)
        }

        if (this._selectedGrants.length) {
            this.getAvailableAgreements()
        } else {
            this.agreements = []
        }
        
    }

    getSelectedCounties(event) {
        const selected = event.detail.selectedRows

        this._selectedCounties = []

        for (let s of selected) {
            this._selectedCounties.push(s.Id)
        } 

        if (this._selectedCounties.length) {
            this.getAvailableAgreements()
        } else {
            this.agreements = []
        }
    }

    getSelectedUsers(event) {
        const selected = event.detail.selectedRows

        this._selectedUsers = []

        for (let s of selected) {
            this._selectedUsers.push(s.Id)
        } 

        // this.getCurrentAccess()
    }

    getSelectedGroupedUsers(event) {
        const selected = event.detail.selectedRows

        this._selectedGroupedUsers = []

        for (let s of selected) {
            this._selectedGroupedUsers.push(s.Id)
        } 

        this.disableRemoveUserButton = this._selectedGroupedUsers.length ? false : true
    }

    getSelectedAgreements(event) {

        const selected = event.detail.selectedRows

        this._selectedAgreements = []

        for (let s of selected) {
            this._selectedAgreements.push(s.Id)
        } 

        this.disableShareButton = this._selectedAgreements.length && this._selectedGroups.length ? false : true
        this.disableRemoveShareButton = this._selectedAgreements.length && this._selectedGroups.length ? false : true
    }

    getSelectedGroups(event) {
        const selected = event.detail.selectedRows

        this._selectedGroups = []

        for (let s of selected) {
            this._selectedGroups.push(s.Id)
        } 

        console.log(this._selectedGroups)
        // this.getCurrentAccess()
        this.getCurrentAccess()

        if (this._selectedGroups.length) {
            this.fetchGroupedUsers()
        }
        this.groupedUsers = []

        this.disableDeleteGroupButton = this._selectedGroups.length ? false : true
        this.disableShareButton = this._selectedAgreements.length && this._selectedGroups.length ? false : true
        this.disableRemoveShareButton = this._selectedAgreements.length && this._selectedGroups.length ? false : true
        this.disableAddUserButton = this._selectedGroups.length ? false : true
    }

    async getCurrentAccess() {

        this.startLoading()

        const result = await currentAccess({groupIds: this._selectedGroups})

        this.currentAccess = result.map(item => {
            item.grantName = item.Grant__r.Name
            item.countyName = item.County__r.Name
            return item
        })

        this.endLoading()
    }
    
    async fetchGroupedUsers() {

        this.startLoading()

        const result = await getGroupedUsers({groupIds: this._selectedGroups})

        // this.groupedUsers = [...this.groupedUsers,...result]
        this.groupedUsers = [...result]

        this.endLoading()
    }

    sortCounties(event) {
       
        const fieldName = event.detail.fieldName

        const sortDirection = event.detail.sortDirection

        this.sortedBy = fieldName;
        this.sortedDirection = sortDirection;
        this.sortData(fieldName, sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.counties))
        // Return the value stored in the field
        console.log(JSON.parse(JSON.stringify('parseData')))
        console.log(JSON.parse(JSON.stringify(parseData)))
        let keyValue = (a) => {
            return a[fieldname]
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1: -1
        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : 0 // handling null values
            y = keyValue(y) ? keyValue(y) : 0
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x))
        });

        this.counties = [...parseData]
    }

    async onCreateGroup(event){
        
        if (!this._selectedUsers.length) {
            this.errorToast('Please Select a user to add to the group.')
            return
        }

        if (!this.contractorGroupName) {
            this.errorToast('Please enter a group name.')
            return
        }

        this.contractorGroupName = `GMS Contractors - ${this.contractorGroupName}`

        const result = await createGroup({name: this.contractorGroupName, uids: this._selectedUsers})

        this.groups = [...this.groups, result]

        this.tastyToast(`${this.contractorGroupName} created.`)
        this.selectedRows = []
        this.contractorGroupName = ''
    }

    async onDeleteGroups() {

        this.startLoading()

        if (!this._selectedGroups.length) {
            this.errorToast('Please Select a group.')
            return
        }

        let result = await deleteGroups({ groupIds : this._selectedGroups })

        this.groups = [...(await getGroups())]

        this.endLoading()

        this.tastyToast('Groups Deleted')
    }

    async onAddUser() {

        this.startLoading();

        if(!this._selectedUsers.length) {
            this.errorToast('Please Select a User')
            return
        }

        await addMember({ groupIds:this._selectedGroups, uids:this._selectedUsers })

        await this.fetchGroupedUsers()

        this.selectedRows = []

        this.endLoading()

        this.tastyToast('Success')
    }

    async onRemoveUser() {
        
        this.startLoading()

        if (!this._selectedGroups.length) {
            this.errorToast('Please Select a Group')
            return
        }
        if (!this._selectedGroupedUsers.length) {
            this.errorToast('Please Select a User')
            return
        }

        await deleteMembers({ groupIds: this._selectedGroups, uids: this._selectedGroupedUsers})

        await this.fetchGroupedUsers()

        this.endLoading()

        this.tastyToast('Success')
    }

    onSetContratorName(event) {
        this.contractorGroupName = event.target.value
        console.log(this.contractorGroupName)
    }

    onOpenCreateGroupModal() {
        this.showCreateGroup = true
    }

    onCloseCreateGroupModal() {
        this.showCreateGroup = false
    }

    onOpenAddUserModal() {

        if (!this._selectedGroups.length) {
            this.errorToast('Please Select a Group')
            return
        }

        this.showAddUser = true
    }

    onCloseAddUserModal() {
        this.showAddUser = false
    }

    startLoading() {
        this.loading = true
    }

    endLoading() {
        this.loading = false
    }

    tastyToast(m) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: m,
                variant: 'success'
            })
        );
    }

    errorToast(m) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: m,
                variant: 'error'
            })
        );
    }
}