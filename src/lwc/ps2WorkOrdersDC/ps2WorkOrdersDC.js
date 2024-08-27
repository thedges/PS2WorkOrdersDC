import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getWorkOrders from '@salesforce/apex/PS2WorkOrdersDCController.getWorkOrders';

export default class Ps2WorkOrdersDC extends LightningElement {
    content;
    data = [];
    tempData;
    columns = [
        { label: 'Subject', fieldName: 'subject__c', sortable: 'true', cellAttributes: { class: 'col-header' } },
        { label: 'Status', fieldName: 'status__c', sortable: 'true' },
        { label: 'Work Order ID', fieldName: 'workorder_id__c', sortable: 'true' },
        {
            label: 'Date Modified', fieldName: 'date_modified__c', type: 'date', sortable: 'true',
            typeAttributes: {
                year: "numeric",
                month: "long",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        }
    ];
    @api title = 'PublicWorks Work Orders';
    @api iconName = 'custom:custom19';
    @api hideForNoRecs = false;
    @api rowCount = 0;
    isLoading = true;
    sortBy;
    sortDirection;

    @api
    get titleString() {
        return this.title + ' (' + this.rowCount + ')';
    }

    @api
    get hide() {
        if (this.hideForNoRecs == true && this.rowCount == 0) {
            return true;
        } else {
            return false;
        }
    }

    connectedCallback() {
        this.loadData();
    }

    loadData() {
        var fieldMap = {};

        this.data = [];
        this.isLoading = true;
        this.rowCount = 0;

        getWorkOrders()
            .then(result => {
                console.log('content=' + result);
                this.content = JSON.parse(result);

                this.rowCount = this.content.rowCount;

                this.isLoading = false;

                ////////////////////////////////////
                // create a map of all the fields //
                ////////////////////////////////////
                Object.keys(this.content.metadata).forEach(key => {
                    const value = this.content.metadata[key];
                    console.log(`Key: ${key}, Value: ${value}`);

                    var temp = {};
                    temp['fieldName'] = key;
                    temp['type'] = value['type'];
                    temp['typeCode'] = value['typeCode'];

                    fieldMap[value.placeInOrder] = temp;
                });

                console.log('fieldMap = ' + JSON.stringify(fieldMap));

                //////////////////////
                // create data list //
                //////////////////////
                var tempData = [];
                for (let i = 0; i < this.content.data.length; i++) {
                    console.log(JSON.stringify(this.content.data[i]));


                    var tempEntry = {};
                    for (let j = 0; j < this.content.data[i].length; j++) {
                        if (fieldMap[j].type == 'TIMESTAMP WITH TIME ZONE') {
                            console.log('value=' + this.content.data[i][j]);
                            var dttm = new Date(this.content.data[i][j]);
                            console.log('dttm=' + dttm.toLocaleString());
                            tempEntry[fieldMap[j].fieldName] = this.content.data[i][j];
                        }
                        else {
                            tempEntry[fieldMap[j].fieldName] = this.content.data[i][j];
                        }
                    }
                    tempData.push(tempEntry);

                }

                console.log('tempList = ' + JSON.stringify(tempData));
                this.data = tempData;

                if (this.sortBy != null && this.sortDirection != null) {
                    this.sortData(this.sortBy, this.sortDirection);
                }
            })
            .catch(error => {
                self.handleError(error);
            });
    }

    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.data));
        // Return the value stored in the field
        let keyValue = (a) => {
            return a[fieldname];
        };
        // cheking reverse direction
        let isReverse = direction === 'asc' ? 1 : -1;
        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ''; // handling null values
            y = keyValue(y) ? keyValue(y) : '';
            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });
        this.data = parseData;
    }

    handleRefresh(evt) {
        console.log('handleRefresh');
        this.loadData();
    }

    handleError(err) {
        console.log('error=' + err);
        console.log('type=' + typeof err);

        this.isLoading = false;

        const event = new ShowToastEvent({
            title: err.statusText,
            message: err.body.message,
            variant: 'error',
            mode: 'sticky',
        });
        this.dispatchEvent(event);
    }
}