const WEBHOOK_URL = "https://discord.com/api/webhooks/***"

// 記録用
const spreadSheet = SpreadsheetApp.openById("***");

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

function filterNotChecked(atcoder_id) {
    let sheet = spreadSheet.getSheetByName(atcoder_id);
    // ユーザーごとに最後にACした時間を記録しておきます
    let latestSolved = sheet.getRange("A1");
    // 次はここから叩きます
    let fromUNIX = latestSolved.getValue() + 1;
    console.log(fromUNIX);
    let acData = fetchAC(atcoder_id, fromUNIX);
    if (acData && acData.length > 0) {
      // ACデータがあれば，最後にACした時間を更新します
      latestSolved.setValue(acData[acData.length-1].epoch_second);
    }
    return acData;
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
    sendMessage("AtCoderのID", "<@DiscordのID>");
    // sendMessage("AtCoderのID2", "<@DiscordのID2>");
    // ユーザー追加はここに足すだけ(スプレッドシートにも新しくシートを作る必要はある)
    return;
}
