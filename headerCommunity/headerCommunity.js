import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

export default class HeaderCommunity extends LightningElement {
    pageReference;
    pageName;

    @wire(CurrentPageReference)
    setPageReference(currentPageReference) {
        if(currentPageReference) {
            this.pageReference = currentPageReference;
            let name = currentPageReference.attributes.name;
            const suffixIndex = name.indexOf('__c');
            this.pageName = name.slice(0, suffixIndex).split('_').join(' ');
        }
    }
}