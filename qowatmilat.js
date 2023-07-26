const rp = require('request-promise');
const fs = require('fs');
const { exit } = require('process');
const { arch } = require('os');

async function retrieveOpenKnowledge(crew_archetypes, access_token) {
    if (!fs.existsSync(__dirname + '/allcrew.json')) {
        throw new Error('Couldnt read data file!');
    }

    let data = JSON.parse(fs.readFileSync(__dirname + '/allcrew.json', 'utf8'));

    _allcrew = new Set(data.map(a => a.symbol));
    for (const archetype of crew_archetypes) {
        if (!_allcrew.has(archetype.symbol) && !archetype.hide_from_cryo) {
            let crew = await loadCrew(archetype.symbol, access_token);
            if (crew) {
                _allcrew.add(crew.symbol);
                await updateCache(crew);
            }
        }
    }

    return JSON.parse(fs.readFileSync(__dirname + '/allcrew.json', 'utf8'));
}

async function updateCache(crew) {
    return new Promise((resolve, reject) => {
        let data = [];
        if (fs.existsSync(__dirname + '/allcrew.json')) {
            data = JSON.parse(fs.readFileSync(__dirname + '/allcrew.json', 'utf8'));
        }
        data.push(crew);

        fs.writeFile(__dirname + '/allcrew.json', JSON.stringify(data), err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

async function loadCrewDetails(symbol, access_token) {
    const reqOptions = {
        method: 'POST',
        uri: 'https://stt.disruptorbeam.com/archetype/batch_update',
        form: {
            'symbols[]': symbol,
            'versions[]': 0,
            client_api: 17
        },
        headers: {
            Authorization: 'Bearer ' + Buffer.from(access_token).toString('base64')
        },
        json: true,
    };
    // fetch("https://stt.disruptorbeam.com/archetype/batch_update", {
    //     "headers": {
    //       "accept": "application/json",
    //       "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    //       "authorization": "Bearer NmQyYmZlZmEtYWIyZi00MzlmLWJkMDgtY2QzNmEyZDcxNjQ5",
    //       "content-type": "application/x-www-form-urlencoded",
    //       "sec-ch-ua": "\"Chromium\";v=\"88\", \"Google Chrome\";v=\"88\", \";Not A Brand\";v=\"99\"",
    //       "sec-ch-ua-mobile": "?0",
    //       "sec-fetch-dest": "empty",
    //       "sec-fetch-mode": "cors",
    //       "sec-fetch-site": "same-origin",
    //       "cookie": "_ga=GA1.2.1869053421.1610759352; fbm_322613001274224=base_domain=.disruptorbeam.com; live__last_visit=1614691489; live__forum_topics=a%3A13%3A%7Bi%3A48315%3Bi%3A1610594808%3Bi%3A64316%3Bi%3A1610772837%3Bi%3A60521%3Bi%3A1610772941%3Bi%3A52354%3Bi%3A1610867293%3Bi%3A63987%3Bi%3A1610926439%3Bi%3A55641%3Bi%3A1610927700%3Bi%3A63957%3Bi%3A1611698590%3Bi%3A60647%3Bi%3A1611884710%3Bi%3A57592%3Bi%3A1613233389%3Bi%3A55583%3Bi%3A1613727572%3Bi%3A47402%3Bi%3A1614044376%3Bi%3A67801%3Bi%3A1614691490%3Bi%3A47610%3Bi%3A1614768526%3B%7D; live__last_activity=1614768525; _startrek_session=fd6d85b43546388b5581815ba17348e2; fbsr_322613001274224=mxvhx0Ag3iJKhIl4HMmKVwifTE0CfhwLUE_jESL7iM8.eyJ1c2VyX2lkIjoiMzYzODgzMTUwMjg4MDA0NSIsImNvZGUiOiJBUUFFdy1jeVMxdnEyd1hPRk40UUpDODZ4N1ctMzZJanFVdnNET1YyNVBTdHhiRlNqeXZmNGhDVW1Pb2d0eU1kUGJfQkNvYWlRa2Ywa0twWlJSMlVpbUZMajJBYmdUa241Z204d0NGZWRvTlh1bG1sb1dHNlBmZzBvNXAxWFVwck16VWhJc0ZFLU5vNVdGY2FRZFk5amhTbThhS3NjS1RhUmdELUpEa0N3NE9kME1XLVVzczZ0ajkxSTU5S1UxcDNrbldvY3c4Sjk5VG5vR0NpZERFYWx6T1JIS3RGaGt2TDlDQ004QWZsZVI5ZGE3MUliZW04N3VmN0c1d3QweUV0QUItaVZjM01CZzExcm9EUlItVFFjcHVDaEpJVDhRVU1UN3hkQVBqWmR4Rm1yV1FFMUZvTEU5QUpnS3ZtaElITi15TV9CTlBZZHRnVlhfS19FMHhvT1hhNEtqQ21fV1B2U2FEdTBDa21EQ19OV1EiLCJvYXV0aF90b2tlbiI6IkVBQUVsYWpGWFEzQUJBSkZjUUpXTGU3Nk9BeEJSRE9QNGxpT3BUdjhxSVpCcWRFcEpkTWxtcFZrcWFaQ1N4WENCSnFIRlhkSFhTeW0yYjBMdjZLUnY5b0dMUXg5cDVvWG5HbTJSOXNTODVXaklJb0NtYU9ZWkJPdzA3Y25GRU5HWkFkVkFCWVpDMzVBbmZ4QkNaQ0RsOHlEU3NJcW5Vb0Y3V0JDT2wyVkcyQjh2dWpmWUg0amkzZGJINGVYdEFiT3dKenh4aEJOcW84R2daRFpEIiwiYWxnb3JpdGhtIjoiSE1BQy1TSEEyNTYiLCJpc3N1ZWRfYXQiOjE2MTUxODE5MjR9"
    //     },
    //     "referrer": "https://stt.disruptorbeam.com/web?signed_request=rilrFdF7CZZl2jD-KC7w0ufEW7ILdCifQrzlr5miSc8.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjE2MTUyNjk2MDAsImlzc3VlZF9hdCI6MTYxNTE4MTkwNywib2F1dGhfdG9rZW4iOiJFQUFFbGFqRlhRM0FCQUpCeE4xTGhzbktQZFMxaWg3aFVjdlpDR3pKU1FRa3k0bXdPWkFhbEtCc3VFTEh4Slg2WGdtcnNWNzM3WHl4QzA1WWs3TDNBSVIxWkIzQ3I1dVB4aEVGZmVPZ0N2SzFDbmZRU25OZWh1cEhWeEtKWkIzak1PTkx4ajdkN25tYXNoN3N4M0ZUZnh1OVJHSVdJZnZzaHhSV2ZVTjJ6Q1BqdExsM29lamhvUlpBZm5tdk94Rm9nWkQiLCJ0b2tlbl9mb3JfYnVzaW5lc3MiOiJBYnhZYkhVenRGSkE0b0EwIiwidXNlcl9pZCI6IjM2Mzg4MzE1MDI4ODAwNDUifQ&fb_locale=en_GB&controller=web&action=landing&provider=facebook&path=web",
    // //     "referrerPolicy": "strict-origin-when-cross-origin",
    //     "body": "symbols%5b%5d=dsc_burnham_red_angel_crew&versions%5b%5d=0&client_api=17",
    //             ""
    //     "method": "POST",
    //     "mode": "cors"
    //   });   

    let res = await rp(reqOptions);

    return res.archetype_cache.archetypes[0];

    // let res = await new Promise((resolve, reject) => {
    //     request(reqOptions, (error, response, body) => {
    //         if (error && response?.statusCode !== 200) {
    //             console.log(error);
    //             console.log(response);
    //             reject(error);
    //         } else {
    //             console.log(body);
    //             exit();
    //             let crew = undefined;
    //             let archetypes = undefined;

    //             if (Array.isArray(body)) {
    //                 body.forEach(element => {
    //                     if (element.character && element.character.crew && element.character.crew[0].symbol) {
    //                         crew = element.character.crew[0];
    //                     } else if (element.item_archetype_cache) {
    //                         // save the archetype cache for this level, as it cannot be retrieved later
    //                         archetypes = element.item_archetype_cache.archetypes;
    //                     }
    //                 });
    //             }

    //             resolve({ crew, archetypes });
    //         }
    //     });
    // });

    // if (res.crew && res.crew.id) {
    //     let data = await dismissCrew(access_token, res.crew.id);
    //     //console.log(data);
    // }

    return res;
}


function mergeArchetypes(target, source) {
    source.forEach(a => {
        if (!target.some(e => e.id === a.id)) {
            target.push(a);
        }
    });

    return target;
}

async function loadCrew(symbol, access_token) {
    console.log(`Qowat Milat - loading ${symbol}`);
    const details = await loadCrewDetails(symbol, access_token);
    details.base_skills = details.max_fully_fused_skills;
    details.skill_data = [
        {
            rarity: 1,
            base_skills: details.max_skills,
        },
        {
        rarity: details.max_rarity,
        base_skills: details.max_fully_fused_skills
        }
    ];
    // await Promise.all(
    //     [10, 20, 30, 40, 50, 60, 70, 80, 90].map(value =>
    //         loadCrewDetails(symbol, value, 1).then((res) => {
    //             let crew = res.crew;

    //             if (!crew || !crew.equipment_slots) {
    //                 return undefined;
    //             }

    //             archetypes = mergeArchetypes(archetypes, res.archetypes);
    //             equipment_slots = equipment_slots.concat(crew.equipment_slots);
    //             max_rarity = crew.max_rarity;

    //             intermediate_skill_data.push({
    //                 rarity: 1,
    //                 level: value,
    //                 base_skills: res.crew.base_skills,
    //                 action: res.crew.action,
    //                 ship_battle: res.crew.ship_battle
    //             });

    //             console.log(`Zhat Vash - loadCrew progress ${symbol} ${value}`);
    //         })
    //     )
    // );

    // let skill_data = [];
    // // Now fill in skills for intermediate fuse levels
    // for (let i = 1; i < max_rarity; i++) {
    //     let res = await loadCrewDetails(symbol, 100, i);

    //     skill_data.push({
    //         rarity: i,
    //         base_skills: res.crew.base_skills,
    //         action: res.crew.action,
    //         ship_battle: res.crew.ship_battle
    //     });
    // }

    // let res = await loadCrewDetails(symbol, 100, max_rarity);
    // res.crew.equipment_slots = equipment_slots.concat(res.crew.equipment_slots);

    // res.crew.archetypes = mergeArchetypes(archetypes, res.archetypes).map(arch => ({
    //     id: arch.id,
    //     symbol: arch.symbol
    // }));
    // res.crew.equipment = [];
    // res.crew.skill_data = skill_data;
    // res.crew.intermediate_skill_data = intermediate_skill_data;
    // delete res.crew.id;
    

    return details;
}

exports.retrieveOpenKnowledge = retrieveOpenKnowledge;