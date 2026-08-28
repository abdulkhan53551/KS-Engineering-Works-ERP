import React from 'react';
import AttachmentManager from '../../../../components/attachments/AttachmentManager';

const PARTY_DOC_TYPES = [
    { value: 'LOGO', label: 'Company Logo / Brand Avatar' },
    { value: 'GST_CERT', label: 'GST Registration Certificate' },
    { value: 'PAN_CARD', label: 'PAN Card Copy' },
    { value: 'MSME_CERT', label: 'MSME / Udyam Certificate' },
    { value: 'CHEQUE', label: 'Cancelled Cheque / Bank Proof' },
    { value: 'AGREEMENT', label: 'Vendor / Customer Agreement' },
    { value: 'OTHER', label: 'Other Document' }
];

const PartyDocumentSection = ({ partyId, readOnly = false }) => {
    return (
        <div className="party-document-section">
            <AttachmentManager
                entityType="PARTY"
                entityId={partyId}
                docTypeOptions={PARTY_DOC_TYPES}
                folder="ks-erp/parties/documents"
                readOnly={readOnly}
            />
        </div>
    );
};

export default PartyDocumentSection;
