const PythonShell = require('python-shell');

class Shell{
    constructor(predict_file){
        try{
            this.predictor = new PythonShell(predict_file,{
                mode:'json',
                pythonPath: 'venv/scripts/python.exe',
                pythonOptions: ['-u']
            });
        }catch (e){
            console.dir(e);
        }
    }
}

module.exports= Shell;