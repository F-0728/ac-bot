const WEBHOOK_URL = "https://discord.com/api/webhooks/***"

const spreadSheet = SpreadsheetApp.openById("***SpreadSheetのID***");

function fetchAC(user_id, unix_second) {
    let options = {
        "method": "get"
    };
    var urlRaw = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${user_id}&from_second=${unix_second}`;
    var urlEncoded = encodeURI(urlRaw);
    let res = UrlFetchApp.fetch(urlEncoded, options);
    let data = JSON.parse(res.getContentText());
    // console.log(data);
    let ac = data.filter((d) => d.result == "AC");
    return ac;
}

// APIにタイムラグがあるため，15分おきに稼動するが検索は30分前まで行う
// JavaScriptのDate.nowはミリ秒単位なので下位3桁は無視
function filterNotChecked(atcoder_id) {
    let fromUNIX = Math.floor((Date.now()-1800000) / 1000);
    console.log(fromUNIX);
    let acData = fetchAC(atcoder_id, fromUNIX);
    let sheet = spreadSheet.getSheetByName(atcoder_id);
    // 30分前まで検索するため，被りを弾く
    let latestSolved = sheet.getRange("A1");
    let ac = acData.filter((d) => d.id != latestSolved.getValue());
    if (ac && ac.length > 0) {
      latestSolved.setValue(ac[ac.length-1].id);
    }
    return ac;
}

function createContent(atcoder_id, discord_id) {
    let acByUser = filterNotChecked(atcoder_id);
    let content = acByUser.map((ac) => {
        return `${ac.problem_id} using ${ac.language}\nhttps://atcoder.jp/contests/${ac.contest_id}/tasks/${ac.problem_id}`
    }).join("\n");
    if (content) {
        return `${discord_id} has solved\n` + content;
    } else {
        return;
    }
}

function sendMessage(atcoder_id, discord_id) {
  let content = createContent(atcoder_id, discord_id);
  if (!content) {
    return;
  }
  let payload =
    {
        "content": content
    };


  let options =
    {
        "method": "post",
        "payload": payload
    };

    UrlFetchApp.fetch(WEBHOOK_URL, options);
    return;

}

function main() {
    sendMessage("***atcoderのユーザー名***", "<@***DiscordのユーザーID***>");
    return;
}
