const CHANNEL_ACCESS_TOKEN = 'rHoruREKMra4tkFI9PjaT+aK6sqE1QsEiwc75U/Gbb7tBvon7EevFuw1PW6bAL8P8dwJnUpXC/pna2odwL8yBcnTWE3G7udX5ep+bIbdw2XPrQIPTPkBgBsZviKxMm1ODgEOXk4gRQ+vEPzBIB4MIAdB04t89/1O/w1cDnyilFU=';

const URL = 'https://api.line.me/v2/bot/message/push';

function  doGet(e) {
  const userId = e.parameter.userId;
  if(!userId) return ContentService.createTextOutput(undefined);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();

  const latestValue = values.reverse();
  const findData = latestValue.find((el)=>el[7].trim()==userId);
  if(!findData) return ContentService.createTextOutput(undefined);

  const response = {
    date: findData[0], 
    proName: findData[1], 
    pushItem: findData[2], 
    payItem: findData[3], 
    balance: findData[4],
    signature: findData[5], 
    otherMessage: findData[6]
  }

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function createFolderIfNotExists(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (!folders.hasNext()) {
    DriveApp.createFolder(folderName);
  }
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();

  const latestValue = values.reverse();
  let lastBalance = 0;
  if (latestValue.length > 0) {
    const findData = latestValue.find((el)=>el[7].trim() == data.lineUserId);
    lastBalance = !findData ? 0 : Number(findData[4]);
  }
  
  var balance = Number(data.pushItem) - Number(data.countItem) + lastBalance;
  let lr = sheet.getLastRow();
  sheet.appendRow([data.now, data.proName, data.countItem, data.countItem, balance, data.otherMessage, data.lineDisplayName, data.lineUserId, 'IMG' + Number(latestValue.length + 1) ]);

  const slipUploadData = JSON.parse(data.slip);
  let imageSlipDcode = Utilities.base64Decode(slipUploadData.base64);
  let imageSlipBlob = Utilities.newBlob(imageSlipDcode, slipUploadData.type, slipUploadData.name);

  const driveFolderLocation = "LaundryApp_Slip_Data";
  createFolderIfNotExists(driveFolderLocation);
  var folders = DriveApp.getFoldersByName(driveFolderLocation);
  var folderId = folders.next().getId();

  let newDriveFile = DriveApp.getFolderById(folderId).createFile(imageSlipBlob);

  let fileSharingLink = newDriveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW).getDownloadUrl();

  
  sheet.getRange(lr+1,9).setFormula(`=IMAGE("${fileSharingLink}")`);
  sheet.setRowHeight(lr+1, 300);

  var pushMessage = [
    '✅ ', data.lineDisplayName, ' 🎉 ทำรายการ 🎉',
    '\nวันที่: ', data.now,
    '\nรายการ: ', data.proName,
    '\nรับ: ', data.countItem,
    '\nจ่าย: ', data.countItem,
    '\nคงเหลือ: ', balance
    ].join('');

  pushToLineOA(data.lineUserId, pushMessage);
}

function pushToLineOA(userId, message) {
  UrlFetchApp.fetch(URL, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'to': userId,
      'messages': [
        {
          'type': 'text',
          'text': message
        }
      ]
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'success': 'ok'})).setMimeType(ContentService.MimeType.JSON);
}