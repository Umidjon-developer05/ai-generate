const apiKey =
  "35c3896e991c412b8836b8a6a6feb972_50c858bdc1e14c63b6731fa409dbafd6_andoraitools";

async function getBalance() {
  try {
    const res = await fetch("https://api.lightxeditor.com/balance", {
      headers: { "x-api-key": apiKey },
    });

    console.log("Balans:", res);
  } catch (err) {
    console.error("Xatolik:", err.response?.data || err.message);
  }
}

getBalance();
