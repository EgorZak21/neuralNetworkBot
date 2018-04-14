const DB = require('./DbClient');
const config = require('./parse-conf');
const vkapi = new (require('./VKapi'))(config.USR_LOGIN,config.USR_PASSWD,config.owner,config.alb);
const DBClient = new DB(config.db_loc);

let added = 0,
    changed = 0,
    correct = 0,
    ins = 0;

function parseCom(text){
    let mark = 		null,
        reg1 = 		/(\d?){5}\d(\.|\,)?(\d?){5}( ?(\||\\|\/|из) ?)10/,
        reg2 = 		/(\d?){5}\d((\.|\,)(\d))?(\d?){4}/,
        regid = 	/id/,
        buff;
    if(text.search(regid) !== -1){
        return mark;
    }
    if(text.match(reg2) == null){
        return mark;
    }
    if(text.match(reg1) != null){
        mark = +text.match(reg1)[0].match(reg2)[0].replace(',','.');
    }else{
        mark = +text.match(reg2)[0].replace(',','.');
    }
    return (mark>10)?10:mark;
}

async function parsePhs(photoes) {
    let callsPhoto=[],
        callsFollows =[],
        counter =0,
        comments,
        follows;

    for(let ph of photoes){
        callsFollows[counter] = vkapi.follows(ph.user_id);
        counter++;
    }
    try{
        follows = await Promise.all(callsFollows);
    }catch (e){
        if(e.code ===18){
            let ider = +e.requestParams[3].value,
                i;
            console.log(ider);
            for( i = 0;i<photoes.length;i++){
                if(photoes[i].user_id===ider) break;
            }
            photoes.splice(i,1);
            await parsePhs(photoes);
        }else{
            console.dir(e);
        }
        return;
    }
    counter = 0;

    for(let ph of photoes){
        callsPhoto[counter] = vkapi.listComs(ph.id);
        counter++;
    }
    try{
        comments = await Promise.all(callsPhoto);
    }catch(e){
        console.dir(photoes);
        console.dir(e);
        await parsePhs(photoes);
        return;
    }

    for(let i = 0;i<comments.length;i++){
        correct++;
        let sum=0,
            count =0;
        for(let coms of comments[i]){
            if(parseCom(coms.text)!=null){
                sum+=parseCom(coms.text);
                count++;
            }
        }
        if(count){
            if(await DBClient.addSample(photoes[i].user_id,sum/count)){
                added++;
                for(let grs of follows[i]){
                    DBClient.adddEntry(grs);
                }
            }else{
                changed++;
            }
        }
    }
}

async function parseAlbum(){
    await DBClient.connect();
    await vkapi.authorize();

    for(let batch = 10; batch < 30;batch++){
        let photoes;
        try{
            photoes = await vkapi.photos(config.offs+batch*config.batch,config.batch);
        }catch(e){
            console.dir(e);
            batch--;
            continue;
        }
        for(let  part= 0;part<(photoes.items.length/config.part);part++){
            console.log(`${part+1} part`);
            await parsePhs(photoes.items.slice(part*config.part,(part+1)*config.part-1));
        }
        console.log(`Batch ${batch+1}: ${correct} correct photoes, added ${added} , changed ${changed}`);
    }
}

async function batch(docs,inputs){
    let requests=[],
        counter=0,
        res;
    for(let doc of docs){
        try{
            requests[counter] = vkapi.follows(doc.person_id);
        }catch(e){
            throw e;
        }

        counter++;
    }
    try{
        res = await Promise.all(requests);
    }catch (e){
        console.dir(e);
        return;
    }
    counter =0 ;
    try{
        for(let doc of docs){
            ins++;
            let inputsDoc = [];
            for(let i =0;i<inputs.length;i++){
                if(res[counter].indexOf(inputs[i])!==-1){
                    inputsDoc[i]=1;
                }else
                    inputsDoc[i]=0;
            }
            if(inputsDoc.length === config.groups_input) {
                await DBClient.insertInputs(doc, inputsDoc);
            }
            counter++;
        }
    }catch (e){
        console.dir(e);
    }

}

async function parsInputs(){
    await DBClient.connect();
    await vkapi.authorize();
    let data;
    let inputs = await DBClient.generateInputs(config.groups_input);
    try{
        data = await DBClient.listSamples();
    }catch(e){
        console.dir(e);
    }
    for(let i = 0;i<Math.ceil(data.length/config.part);i++){
        await batch(data.slice(i*config.part,(i+1)*config.part),inputs);
        console.log(`Batch ${i+1} parsed ${ins}`);
    }
}
parsInputs();