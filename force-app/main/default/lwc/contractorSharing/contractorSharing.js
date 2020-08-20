import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import getGrants from '@salesforce/apex/contractorSharingHelper.getGrants';
import getCounties from '@salesforce/apex/contractorSharingHelper.getCounties';
import getUsers from '@salesforce/apex/contractorSharingHelper.getUsers';
import createShares from '@salesforce/apex/contractorSharingHelper.createShares';
import deleteShares from '@salesforce/apex/contractorSharingHelper.deleteShares';
import currentAccess from '@salesforce/apex/contractorSharingHelper.currentAccess';

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

    @track userColumns = [{ 
        label: 'Name', 
        fieldName: 'Name', 
        type: 'text' 
    }, {
        label: 'Email',
        fieldName: 'Email',
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

    @track grants = {}
    @track counties = {}
    @track users = {}
    @track currentAccess = {}

    @track _selectedGrants = []
    @track _selectedCounties = []
    @track _selectedUsers = []

    @track sortBy ='Name';
    @track sortDirection = 'asc';

    @track loading = false

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

    }

    async agreementShares(event) {

        this.startLoading()
        this.disabled = true

        let e = false

        if (!this._selectedGrants.length) {
            this.errorToast('Please Select a Grant(s)')
            e = true
        }

        if (!this._selectedCounties.length) {
            this.errorToast('Please Select a County(s)')
            e = true
        }

        if (!this._selectedUsers.length) {
            this.errorToast('Please Select a User(s)')
            e = true
        }

        if (e) {
            this.disabled = false
            this.endLoading()
            return
        }

        try {
            const result = await createShares({grantIds: this._selectedGrants, countyIds: this._selectedCounties, userIds: this._selectedUsers})

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

        if (!this._selectedGrants.length) {
            this.errorToast('Please Select a Grant(s)')
            e = true
        }

        if (!this._selectedCounties.length) {
            this.errorToast('Please Select a County(s)')
            e = true
        }

        if (!this._selectedUsers.length) {
            this.errorToast('Please Select a User(s)')
            e = true
        }

        if (e) {
            this.disabled = false
            this.endLoading()
            return
        }

        try {
            const result = await deleteShares({grantIds: this._selectedGrants, countyIds: this._selectedCounties, userIds: this._selectedUsers})

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
    }

    getSelectedCounties(event) {
        const selected = event.detail.selectedRows

        this._selectedCounties = []

        for (let s of selected) {
            this._selectedCounties.push(s.Id)
        } 
    }

    getSelectedUsers(event) {
        const selected = event.detail.selectedRows

        this._selectedUsers = []

        for (let s of selected) {
            this._selectedUsers.push(s.Id)
        } 

        this.getCurrentAccess()
    }

    async getCurrentAccess() {

        this.startLoading()

        const result = await currentAccess({userIds: this._selectedUsers})

        this.currentAccess = result.map(item => {
            item.grantName = item.Grant__r.Name
            item.countyName = item.County__r.Name
            return item
        })

        this.endLoading()

        console.log('this.currentAccess')
        console.log(JSON.parse(JSON.stringify(this.currentAccess)))
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
                title: 'Error Creating Shares',
                message: m,
                variant: 'error'
            })
        );
    }
}