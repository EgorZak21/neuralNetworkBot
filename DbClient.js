const mongo =  	require( 'mongoose' );
const Schema = mongo.Schema;

class DbClient {
    constructor(dbloc){
        this.dbloc = dbloc;
        this.groups = mongo.model("Groups",new Schema({
            group_id: Number,
            entry: Number
        }));
    }

    async connect(){
        try{
            await mongo.connect(this.dbloc);
        }catch(e){ throw e; }
        console.log('connected');
    }

    async generateInputs(count){
        let inputs = [];
        let docs = await this.groups.find().sort({entry: -1});
        for(let i =0;i<count;i++){
            inputs[i]= docs[i+1].group_id;
        }
        return inputs;
    }
}

module.exports = DbClient;
