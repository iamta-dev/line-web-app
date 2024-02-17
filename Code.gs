const CHANNEL_ACCESS_TOKEN = 'rHoruREKMra4tkFI9PjaT+aK6sqE1QsEiwc75U/Gbb7tBvon7EevFuw1PW6bAL8P8dwJnUpXC/pna2odwL8yBcnTWE3G7udX5ep+bIbdw2XPrQIPTPkBgBsZviKxMm1ODgEOXk4gRQ+vEPzBIB4MIAdB04t89/1O/w1cDnyilFU=';

const URL = 'https://api.line.me/v2/bot/message/push';

function doPost(e) {
  var action = e.parameter.action
  if (action == 'adddata') {
    return addDataFromAPI(e)
  }
}

function addDataFromAPI(e){

  var data = JSON.parse(e.postData.contents)

  var ss = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var balance = Number(data.pushItem) - Number(data.countItem);
  var signature = data.lineDisplayName;
  ss.appendRow([data.now, data.proName, data.countItem, data.countItem, balance, signature, data.otherMessage])

  var pushMessage = [
    'วันที่: ', data.now,
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