function roundNumber(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

async function getData(board, timeFrom) {
    return new Promise((resolve, reject) => {
        fetch('http://10.20.1.1:5000/getData?board=' + board + "&ts=" + timeFrom) //při programování na pc změnit ip adresu na localhost:5000
            .then(response => response.json())
            .then(data => {
                resolve(data);
            });
    });
}
document.addEventListener('DOMContentLoaded', function() {
    reload().then((ret) => {
        if (ret) setInterval(reload, 1000);
    });
});

async function reload() {
    if (location.pathname === "/") {
        await getData(1, (Date.now() - (1000 * 20))).then(data => {
            document.querySelector("#home-active").style.color = data.length > 0 ? "green" : "red";
        });
        await getData(2, (Date.now() - (1000 * 20))).then(data => {
            document.querySelector("#outside-active").style.color = data.length > 0 ? "green" : "red";
        });

        let months = {
            0: "Leden",
            1: "Únor",
            2: "Březen",
            3: "Duben",
            4: "Květen",
            5: "Červen",
            6: "Červenec",
            7: "Srpen",
            8: "Září",
            9: "Říjen",
            10: "Listopad",
            11: "Prosinec"
        }

        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();

        document.querySelector("#months_history").innerHTML = "";

        for (let i = 0; i < 12; i++) {
            let month = months[currentMonth];

            if (currentYear >= 2022) {
                if (!(currentYear === 2022 && currentMonth < 8)) {
                    document.querySelector("#months_history").innerHTML +=
                        `<a href="/archives/archive?date=${currentMonth + 1}-${currentYear}">${month} ${currentYear}</a>`;
                }
            }

            currentMonth -= 1;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear -= 1;
            }
        }

        return true;
    } else if (location.pathname === "/archives/archive") {
        let month, year;
        try {
            let params = new URLSearchParams(location.search);
            let date = params.get("date");
            month = date.split("-")[0];
            year = date.split("-")[1];
        } catch (e) {
            month = new Date().getMonth() + 1;
            year = new Date().getFullYear();
        }
        document.querySelector("#title").innerHTML+= `Historie měsíce: ${month}.${year}`;
        let startTime = new Date(year, month - 1, 1, 0, 0);

        await getData(1, startTime.getTime()).then(data => {
            let doneDays = [];
            data.forEach(row => {
                let date = new Date(row.timestamp);
                if (date.getMonth() !== startTime.getMonth()) return;
                if (!doneDays.includes(date.getUTCDate()) && date.getHours() > 12) {
                    doneDays.push(date.getUTCDate());
                    document.querySelector("#data-table tbody").innerHTML +=
                        `
                        <tr id="row-${date.getUTCDate()}">
                            <td class="date">${date.getUTCDate() + "." + (date.getMonth() + 1) + "."}</td>
                            <td class="home_temp">${row.temp + "°C"}</td>
                            <td class="home_hum">${row.hum + "%"}</td>
                            <td class="home_bmp">${row.bmp + "hPa"}</td>
                            <td class="out_temp">-</td>
                            <td class="out_hum">-</td>
                            <td class="out_lum">-</td>
                            <td class="out_uv">-</td>
                        </tr>
                        `;
                }
            })
        });

        await getData(2, startTime.getTime()).then(data => {
            let doneDays = [];
            data.forEach(row => {
                let date = new Date(row.timestamp);
                if (date.getMonth() !== startTime.getMonth()) return;
                if (!doneDays.includes(date.getUTCDate()) && date.getHours() > 12) {
                    doneDays.push(date.getUTCDate());
                    var hRow = document.querySelector("#row-" + date.getUTCDate());
                    if (hRow !== null) {
                        hRow.querySelector(".out_temp").innerHTML = row.temp + "°C";
                        hRow.querySelector(".out_hum").innerHTML = row.hum + "%";
                        hRow.querySelector(".out_lum").innerHTML = row.lux + " lx";
                        hRow.querySelector(".out_uv").innerHTML = row.uv + " mW/m²";
                    } else {
                        document.querySelector("#data-table tbody").innerHTML +=
                            `
                            <tr id="row-${date.getUTCDate()}">
                                <td class="date">${date.getUTCDate() + "." + (date.getMonth() + 1) + "."}</td>
                                <td class="home_temp">-</td>
                                <td class="home_hum">-</td>
                                <td class="home_bmp">-</td>
                                <td class="out_temp">${row.temp + "°C"}</td>
                                <td class="out_hum">${row.hum + "%"}</td>
                                <td class="out_lum">${row.lux + " lx"}</td>
                                <td class="out_uv">${row.uv + " mW/m²"}</td>
                            </tr>
                            `;
                    }
                }
            })
        });
        return false;
    } else if (location.pathname.startsWith("/filter")) {
        document.querySelector("table.table tbody").innerHTML = "";

        let type = location.pathname.split("/")[2];
        let appendData = "";
        let firstFetch = 2, secondFetch = 1;
        let round = false;
        switch (type) {
            case "temperature":
                type = "temp";
                appendData = "°C";
                round = true;
                break;
            case "humidity":
                type = "hum";
                appendData = "%";
                round = true;
                break;
            case "pressure":
                type = "bmp";
                appendData = "hPa";
                firstFetch = 1;
                secondFetch = 0;
                break;
            case "uvradiation":
                type = "uv";
                appendData = " mW/m²";
                secondFetch = 0;
                break;
        }

        await getData(firstFetch, Date.now() - (1000 * 60 * 60 * 24)).then(data => {
            let doneHours = [];
            data = data.reverse();
            data.forEach(row => {
                let date = new Date(row.timestamp + (3600000));
                if (!doneHours.includes(date.getUTCDate() + "-" + date.getUTCHours())) {
                    doneHours.push(date.getUTCDate() + "-" + date.getUTCHours());
                    document.querySelector("table.table tbody").innerHTML +=
                        `
                        <tr id="row-${date.getUTCDate()}-${date.getUTCHours()}">
                            <td class="date">${date.getUTCDate() + "." + (date.getUTCMonth() + 1) + ". " + date.getUTCHours() + ":00"}</td>
                            <td class="out">${(round ? roundNumber(row[type], 1) : row[type]) + appendData}</td>
                            ${secondFetch !== 0 ? '<td class="in">-</td>' : ''}
                        </tr>
                        `;
                }
            })
        });
        await getData(secondFetch, Date.now() - (1000 * 60 * 60 * 24)).then(data => {
            let doneHours = [];
            data = data.reverse();
            data.forEach(row => {
                let date = new Date(row.timestamp + (3600000));
                if (!doneHours.includes(date.getUTCDate() + "-" + date.getUTCHours())) {
                    doneHours.push(date.getUTCDate() + "-" + date.getUTCHours());
                    var hRow = document.querySelector("#row-" + date.getUTCDate() + "-" + date.getUTCHours());
                    if (hRow !== null) {
                        hRow.querySelector(".in").innerHTML = (round ? roundNumber(row[type], 1) : row[type]) + appendData;
                    } else {
                        document.querySelector("table.table tbody").innerHTML +=
                            `
                        <tr id="row-${date.getUTCDate()}-${date.getUTCHours()}">
                            <td class="date">${date.getUTCDate() + "." + (date.getUTCMonth() + 1) + ". " + date.getUTCHours() + ":00"}</td>
                            <td class="out">-</td>
                            <td class="in">${(round ? roundNumber(row[type], 1) : row[type]) + appendData}</td>
                        </tr>
                            `;
                    }
                }
            });
        });
        return false;
    } else if (location.pathname === "/place/home") {
        let table = document.querySelector("#data_table tbody");
        table.innerHTML = "";

        let hours = [0, 3, 6, 9, 12, 15, 18, 21];

        await getData(1, Date.now() - (1000 * 60 * 60 * 24 * 3)).then(data => {
            let doneDays = [];
            data.forEach(row => {
                let date = new Date(row.timestamp + 3600000);
                if (!doneDays.includes(date.getUTCDate() + "-" + date.getUTCMonth()) && hours.includes(date.getUTCHours())) {
                    doneDays.push(date.getUTCDate() + "-" + date.getUTCMonth() + "-" + date.getUTCHours());

                    let hRow = document.querySelector("#row-" + date.getUTCDate() + "-" + date.getUTCMonth());
                    if (hRow == null) {
                        table.innerHTML +=
                            `
                            <tr id="${"row-" + date.getUTCDate() + "-" + date.getUTCMonth()}">
                                <td>${date.getUTCDate() + "." + (date.getUTCMonth() + 1) + "."}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                                `;
                    }
                    let index = hours.indexOf(date.getUTCHours()) + 1;
                    document.querySelectorAll("#row-" + date.getUTCDate() + "-" + date.getUTCMonth() + " td")[index].innerHTML = roundNumber(row.temp, 1) + "°C";
                }
            });
            document.querySelector("#data_table tbody").innerHTML = table.innerHTML;
        });

        async function reloadPercentages() {
            await getData(1, Date.now() - (1000 * 60 * 5)).then(data => {
                if (data.length === 0) {
                    document.querySelectorAll(".cislo").forEach(value => {
                        value.innerHTML = "∅";
                        value.parentElement.style.setProperty("--percentage", 0);
                    });
                } else {
                    data = data[data.length - 1];
                    var tempPer = data.temp + 50;
                    var humPer = data.hum;
                    var bmpPer = ((data.bmp - 800) * 100) / (1200 - 800);

                    document.getElementById('teplota').style.setProperty("--percentage", tempPer);
                    document.getElementById('teplota').getElementsByClassName("semi-donut-number")[0].innerHTML = roundNumber(data.temp, 1) + "°C";
                    document.getElementById('vlhkost').style.setProperty("--percentage", humPer);
                    document.getElementById('vlhkost').getElementsByClassName("semi-donut-number")[0].innerHTML = roundNumber(data.hum, 1) + "%";
                    document.getElementById('tlak').style.setProperty("--percentage", bmpPer);
                    document.getElementById('tlak').getElementsByClassName("semi-donut-number")[0].innerHTML = data.bmp + "hPa";
                }
            });
        }

        await reloadPercentages();
        setInterval(async () => {
            await reloadPercentages()
        },);
        return false;
    } else if (location.pathname === "/place/outside") {
        let table = document.querySelector("#data_table tbody");
        table.innerHTML = "";

        let hours = [0, 3, 6, 9, 12, 15, 18, 21];

        await getData(2, Date.now() - (1000 * 60 * 60 * 24 * 3)).then(data => {
            let doneDays = [];
            data.forEach(row => {
                let date = new Date(row.timestamp + 3600000);
                if (!doneDays.includes(date.getUTCDate() + "-" + date.getUTCMonth()) && hours.includes(date.getUTCHours())) {
                    doneDays.push(date.getUTCDate() + "-" + date.getUTCMonth() + "-" + date.getUTCHours());

                    let hRow = document.querySelector("#row-" + date.getUTCDate() + "-" + date.getUTCMonth());
                    if (hRow == null) {
                        table.innerHTML +=
                            `
                            <tr id="${"row-" + date.getUTCDate() + "-" + date.getUTCMonth()}">
                                <td>${date.getUTCDate() + "." + (date.getUTCMonth() + 1) + "."}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                                `;
                    }
                    let index = hours.indexOf(date.getUTCHours()) + 1;
                    document.querySelectorAll("#row-" + date.getUTCDate() + "-" + date.getUTCMonth() + " td")[index].innerHTML = roundNumber(row.temp, 1) + "°C";
                }
            });
            document.querySelector("#data_table tbody").innerHTML = table.innerHTML;
        });

        async function reloadPercentages() {
            await getData(2, Date.now() - (1000 * 60 * 5)).then(data => {
                if (data.length === 0) {
                    document.querySelectorAll(".cislo").forEach(value => {
                        value.innerHTML = "∅";
                        value.parentElement.style.setProperty("--percentage", 0);
                    });
                } else {
                    data = data[data.length - 1];
                    var tempPer = data.temp + 50;
                    var humPer = data.hum;
                    var luxPer = ((data.lux - 0) * 100) / (10000);
                    var uvPer = ((data.uv - 0) * 100) / (11);

                    document.getElementById('teplota').style.setProperty("--percentage", tempPer);
                    document.getElementById('teplota').getElementsByClassName("semi-donut-number")[0].innerHTML = roundNumber(data.temp, 1) + "°C";
                    document.getElementById('vlhkost').style.setProperty("--percentage", humPer);
                    document.getElementById('vlhkost').getElementsByClassName("semi-donut-number")[0].innerHTML = roundNumber(data.hum, 1) + "%";
                    document.getElementById('lux').style.setProperty("--percentage", luxPer);
                    document.getElementById('lux').getElementsByClassName("semi-donut-number")[0].innerText = data.lux + " lx";
                    document.getElementById('uv').style.setProperty("--percentage", uvPer);
                    document.getElementById('uv').getElementsByClassName("semi-donut-number")[0].innerText = data.uv + " UV";
                }
            });
        }
        await reloadPercentages();
        setInterval(async () => {
            await reloadPercentages()
        },);
        return false;
    }
}
