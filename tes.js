async function getCreditsInfo() {
  try {
    const response = await fetch(
      "https://api.lightxeditor.com/external/api/v1/creditsInfo",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": `35c3896e991c412b8836b8a6a6feb972_50c858bdc1e14c63b6731fa409dbafd6_andoraitools`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API javobi:", data);
    return data;
  } catch (error) {
    console.error("Xatolik:", error);
  }
}

getCreditsInfo();
