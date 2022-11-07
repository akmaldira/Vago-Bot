const axios = require('axios');
const delay = require("delay")

const claim = async() => {
    const data = {
        boxCategory: "GreyBox"
    }
    const headers = {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,id;q=0.7',
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImVtYWlsIjoiYWttYWxkaXJhYUBnbWFpbC5jb20ifSwiZXhwIjoxNjY3OTI3NjA1LCJpYXQiOjE2Njc4NDEyMDV9.2zLZxyNa_7jx_-EyTiwtJQu68jpKA9n0yTRy0aN259w',
            'content-length': data.length,
            'content-type': 'application/json;charset=UTF-8',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
        }
    }
    return await axios.post('https://api.vagoweb3.com/api/v1/blind/box/extract', data, headers)
    .then(res => res.data)
}

(async() => {
    for(let i = 0; i <= 33; i++) {
        claim().then((res) => console.log(res.message))
        await delay(3000);
    }
})();