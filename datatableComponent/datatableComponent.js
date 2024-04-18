import { LightningElement, wire, api, track } from 'lwc';
import getData from '@salesforce/apex/datatableData.getData';
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import OPPORTUNITY_OBJECT from "@salesforce/schema/Opportunity";
import CASE_OBJECT from "@salesforce/schema/Case";
import picklistValues from '@salesforce/apex/datatableData.picklistValues';

export default class DatatableComponent extends LightningElement {
    objectOnPage;
    recordTypeId;
    debugrecordTypeId;
    @api firstField;
    @api secondField;
    @api thirdField;
    @api fourthField;
    @api fifthField;
    @api objectName;
    @api firstFilter;
    @api secondFilter;
    fieldsWOspace = [];
    columns;
    @track data;
    @track displayedData;
    @track filteredData;
    sortBy;
    sortDirection;
    firstFilterValue;
    firstFilterOptions;
    firstFilterBy;
    secondFilterValue;
    secondFilterOptions;
    secondFilterBy;
    query;

    numberOfRecords = 12;
    firstPageRecord = 0;
    lastPageRecord = 12;
    countRecords = 1;
    countLastRecord;
    countPages = 1;
    lastPage;
    prevButton;
    nextButton;

    connectedCallback() {
        this.objectOnPage = this.objectName.toLowerCase() === 'case' ? CASE_OBJECT : OPPORTUNITY_OBJECT;
        if (this.objectName === 'Opportunity') {
            this.firstFilterBy = this.secondField;
            this.secondFilterBy = this.fifthField;
        } else {
            this.firstFilterBy = this.thirdField;
            this.secondFilterBy = this.fifthField;
        }
        console.log(this.objectOnPage)
        this.fieldsWOspace = [
            this.firstField,
            this.secondField,
            this.thirdField,
            this.fourthField,
            this.fifthField
        ].map((el) => {
            return el.split(' ').join('');
        })
        const createQueryFields = this.fieldsWOspace.reduce((acc, cur) => {
            acc += cur + ', ';
            return acc;
        }, '');
        const lastComma = createQueryFields.lastIndexOf(',');
        getData({ query: createQueryFields.slice(0, lastComma), objectName: this.objectName }).then(res => {
            this.data = res;
            this.filteredData = res;
            this.displayedData = this.filteredData.slice(this.firstPageRecord, this.numberOfRecords);
            this.lastPageRecord = this.numberOfRecords;
            this.lastPage = Math.ceil(res.length / this.numberOfRecords);
            this.countLastRecord = this.lastPageRecord;
        })
        picklistValues({ objectName: this.objectName, fieldName: this.firstFilterBy }).then(res => {
            this.firstFilterOptions = [{ label: "All", value: "All" }].concat(res.map((el) => {
                return { label: el, value: el }
            }));
            this.firstFilterValue = this.firstFilterOptions[0].value;
        })
        picklistValues({ objectName: this.objectName, fieldName: this.secondFilterBy }).then(res => {
            this.secondFilterOptions = [{ label: "All", value: "All" }].concat(res.map((el) => {
                return { label: el, value: el }
            }));
            this.secondFilterValue = this.secondFilterOptions[0].value;
        })
    }

    @wire(getObjectInfo, { objectApiName: '$objectOnPage' })
    objectInfo({ data, error }) {
        if (data) {
            this.columns = this.fieldsWOspace.map((el) => {
                return { label: data.fields[el].label, fieldName: data.fields[el].apiName, type: el === 'CreatedDate' ? 'date' : 'text', sortable: 'true' }
            });
            this.firstFilter = data.fields[this.firstFilter].label;
            this.secondFilter = data.fields[this.secondFilter].label;
            this.recordTypeId = data.defaultRecordTypeId;
        } else if (error) {
            console.error(error);
        }
    }

    handleFirstFilter(event) {
        const value = event.detail.value;
        this.filteredData = this.data.filter((el) => {
            return this.secondFilterValue !== 'All' ? el[this.secondFilterBy] === this.secondFilterValue : el
        }).filter((el) => {
            return value !== 'All' ? el[this.firstFilterBy] === value : el
        })
        this.firstFilterValue = value;
        this.firstPageRecord = 0;
        this.lastPageRecord = 12;
        this.countRecords = 1;
        this.countLastRecord =
            this.filteredData.length >= this.numberOfRecords ?
                this.lastPageRecord :
                this.filteredData.length;
        this.countPages = 1;
        this.lastPage = Math.ceil(this.filteredData.length / this.numberOfRecords);
        this.displayedData = this.filteredData.slice(this.firstPageRecord, this.numberOfRecords);
    }
    handleSecondFilter(event) {
        const value = event.detail.value;
        this.filteredData = this.data.filter((el) => {
            return this.firstFilterValue !== 'All' ? el[this.firstFilterBy] === this.firstFilterValue : el
        }).filter((el) => {
            return value !== 'All' ? el[this.secondFilterBy] === value : el
        })
        this.secondFilterValue = value;
        this.firstPageRecord = 0;
        this.lastPageRecord = 12;
        this.countRecords = 1;
        this.countLastRecord =
            this.filteredData.length >= this.numberOfRecords ?
                this.lastPageRecord :
                this.filteredData.length;
        this.countPages = 1;
        this.lastPage = Math.ceil(this.filteredData.length / this.numberOfRecords);
        this.displayedData = this.filteredData.slice(this.firstPageRecord, this.numberOfRecords);
    }
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        let fieldName = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        // let isReverse = this.sortDirection === 'asc' ? 1: -1;
        // let keyValue = (x) => {
        //     console.log(x);
        //     return x[this.sortBy];
        // };
        console.log(fieldName);
        switch(fieldName) {
            case 'CreatedDate': {
                this.filteredData = JSON.parse(JSON.stringify(this.filteredData)).sort((a, b) => {
                    let aField = a[fieldName] ? a[fieldName] : ''; 
                    let bField = b[fieldName] ? b[fieldName] : '';
                    return this.sortDirection === 'asc' ? new Date(aField) - new Date(bField) : new Date(bField) - new Date(aField);
                })
                break;
            }
            case 'CaseNumber': {
                this.filteredData = JSON.parse(JSON.stringify(this.filteredData)).sort((a, b) => {
                    let aField = a[fieldName] ? a[fieldName] : ''; 
                    let bField = b[fieldName] ? b[fieldName] : '';
                    return this.sortDirection === 'asc' ? aField - bField : bField - aField;
                })
                this.displayedData = this.filteredData.slice(this.firstPageRecord, this.lastPageRecord);
                break;
            }
            default: 
                break;
        }
        // this.filteredData = this.filteredData.sort((a, b) => {
        //     a = a[fieldName] ? a[fieldName] : ''; 
        //     b = b[fieldName] ? b[fieldName] : '';
        //     console.log(JSON.stringify({a, b}))
        //     return isReverse * ((a > b));
        // })
    }
    download(e) {
        let doc = '<table>';
        doc += '<tr>';
        this.columns.forEach((el) => {
            doc += `<th>${el.label}</th>`
        })
        doc += '</tr>';
        this.filteredData.forEach(el => {
            doc += '<tr>';
            this.fieldsWOspace.forEach(fieldName => {
                doc += '<th>' + el[fieldName] + '</th>';
            })
            doc += '</tr>';
        });
        doc += '</table>'
        let element = 'data:application/vnd.ms-excel,' + encodeURIComponent(doc);
        let downloadElement = document.createElement('a');
        downloadElement.href = element;
        downloadElement.target = '_self';
        downloadElement.download = 'DatatableData.xls'; 
        document.body.appendChild(downloadElement);
        downloadElement.click();
    }

    // pagination
    handleNext(e) {
        if (this.countPages != this.lastPage) {
            this.countPages = this.countPages + 1;
            this.firstPageRecord = this.firstPageRecord + this.numberOfRecords;
            this.lastPageRecord = this.lastPageRecord + this.numberOfRecords;
            if (this.countPages == this.lastPage) {
                this.countLastRecord = this.filteredData.length;
            } else {
                this.countLastRecord = this.lastPageRecord;
            }
            this.displayedData = this.filteredData.slice(this.firstPageRecord, this.lastPageRecord);
            this.countRecords = this.countRecords + this.numberOfRecords;
        }
    }

    handlePrevious(e) {
        const isNotNegative = this.firstPageRecord - this.numberOfRecords >= 0 ? true : false;
        if (isNotNegative) {
            this.firstPageRecord = this.firstPageRecord - this.numberOfRecords;
            this.lastPageRecord = this.lastPageRecord - this.numberOfRecords;
            this.countPages = this.countPages - 1;
            this.countRecords = this.countRecords - this.numberOfRecords;
        } else {
            this.firstPageRecord = 0;
            this.lastPageRecord = this.numberOfRecords
        }
        this.countLastRecord = this.lastPageRecord;
        this.displayedData = this.filteredData.slice(this.firstPageRecord, this.lastPageRecord);
    }
}