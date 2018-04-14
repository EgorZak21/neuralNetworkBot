const mongo =  	require( 'mongoose' );
const Schema = mongo.Schema;

class DbClient {
    constructor(dbloc){
        this.dbloc = dbloc;
        this.sampling = mongo.model("Sampling",new Schema({
            person_id: 	Number,
            mark: 		Number,
            groups_id: 	[Number]
        }));
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

    async addSample(person_id, mark){
        let doc,
            client = this;
        try{
            doc = await client.sampling.findOne({person_id: person_id});
        }catch(e){
            throw e;
        }
        if(doc === null){
            client.sampling.create({
                person_id: person_id,
                mark: mark
            });
            return true;
        }else{
            doc.set({mark: (doc.mark/2 + mark)/3});
            try{
                await doc.save();
            }catch(err){
                console.dir(err);
                return false;
            }
        }
    }

    adddEntry(group_id){
        let client = this;
        client.groups.findOne({group_id: group_id})
            .then(doc => {
                if(doc === null){
                    client.groups.create({
                        group_id: group_id,
                        entry: 1
                    });
                }else{
                    doc.set({entry: doc.entry+1});
                    doc.save().catch(err => console.dir(err));
                }
            }).catch(err => console.dir(err));
    }

    async remove(id){
        this.sampling.remove({person_id: id})
            .then(()=>{return true;})
            .catch(e=>{ throw e;});
    }

    async listSamples(){
        return await this.sampling.find({groups_id: []});
    }

    async insertInputs(doc, input){
        try{
            doc.set({groups_id: input});
            return await doc.save();
        }catch(e){
            throw e;
        }

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
