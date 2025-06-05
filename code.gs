const API_KEY = "YOUR_API_KEY_HERE"; // Replace with your actual API Key

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Image OCR")
    .addItem("Open OCR Sidebar", "showSidebar")
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("UploadSidebar")
    .setTitle("Drag & Drop OCR")
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function uploadImageToDrive(base64Image, filename) {
  const contentType = base64Image.match(/^data:(image\/.+);base64,/)[1];
  const bytes = Utilities.base64Decode(base64Image.split(",")[1]);
  const blob = Utilities.newBlob(bytes, contentType, filename);
  const file = DriveApp.createFile(blob);
  return file.getId();
}

function extractTextFromFileId(fileId) {
  const file = DriveApp.getFileById(fileId);
  const blob = file.getBlob();
  const encodedImage = Utilities.base64Encode(blob.getBytes());

  const payload = {
    requests: [
      {
        image: { content: encodedImage },
        features: [{ type: "TEXT_DETECTION" }]
      }
    ]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
    options
  );

  const result = JSON.parse(response.getContentText());
  const text = result.responses?.[0]?.fullTextAnnotation?.text || "No text found";
  SpreadsheetApp.getActiveSpreadsheet().getActiveCell().setValue(text);
}

function processImage(base64Image, filename) {
  const fileId = uploadImageToDrive(base64Image, filename);
  extractTextFromFileId(fileId);
}