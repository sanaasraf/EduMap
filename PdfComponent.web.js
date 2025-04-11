// PdfComponent.web.js
import React from 'react';

const PdfComponent = (props) => {
  const { source } = props;
  const pdfUri = source?.uri;

  if (!pdfUri) {
    return <p style={{ color: 'red' }}>No PDF to display</p>;
  }

  return (
    <iframe
      src={pdfUri}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="PDF Preview"
    />
  );
};

export default PdfComponent;
