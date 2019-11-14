const fs = require("fs");
const {execSync} = require('child_process');

const helpers = {
    checkFolderExists: function(dir){
        if( dir===undefined || dir==="" ){
            console.error({dir});
            throw new Error("dir is not defined (maybe cli param 1)");
        }
        
        if( !fs.existsSync(dir) ){
            console.error({dir});
            throw new Error("dir is not found in the fs (maybe cli param 1)");
        }

        return true;
    }
};

(function(){
    const start_dir = process.argv[2];

    if( start_dir===undefined ){
        console.error("start_dir is undefined (cli param 1)");
        process.exit();
    }

    const expanded_folder_obj = expandFolder( start_dir, true );
    const condensed_files_obj = condenseFiles( expanded_folder_obj );
    const condensed_dir_name = "condensed";
    
    writeCondensedFilesObj( start_dir, condensed_files_obj, condensed_dir_name );
    
    removeNotCondensed( start_dir, expanded_folder_obj, condensed_dir_name );
})();

function removeNotCondensed( start_dir, expanded_folder_obj, condensed_dir_name ){
    console.log(start_dir);

    expanded_folder_obj.children
    .map(cur=>cur.name)
    .forEach(async (cur_sub_dir)=>{

        if( cur_sub_dir!==condensed_dir_name ){

            const options = {recursive:true};

            console.log(`${start_dir}/${cur_sub_dir}`,options);
            const exec_str = `rm -rf "${start_dir}/${cur_sub_dir}"`;
            console.log(exec_str);
            await execPromise(exec_str);
            console.log(`removed ${start_dir}/${cur_sub_dir}`);
        }
    })
}

function writeCondensedFilesObj( start_dir, condensed_files_obj, condensed_dir_name ){

    start_dir = removeTrailingSlash(start_dir);
        
    const condensed_dir = `${start_dir}/${condensed_dir_name}`;
    checkMakeDir(condensed_dir);

    for(let k in condensed_files_obj){
        const condensed_files_str = condensed_files_obj[k].join("\n")
        
        const condensed_log_folder = `${condensed_dir}/${k}`;
        checkMakeDir(condensed_log_folder);

        const file_path = `${condensed_log_folder}/log.csv`;
        // console.log({file_path});
        fs.writeFileSync(file_path, condensed_files_str);
    }
}

function checkMakeDir( dir ){
    if( !fs.existsSync(dir) ){
        fs.mkdirSync(dir, {recursive:true});
    }
}

function  condenseFiles( expanded_folder_obj ){

    const condensed_obj = {};

    expanded_folder_obj.children.forEach(( cur_date_folder_obj )=>{

        // console.log(`${JSON.stringify(cur_date_folder_obj)}`)
        // process.exit();

        if(cur_date_folder_obj.name===".DS_Store"){
            return;
        }

        cur_date_folder_obj.children.forEach((cur_log_folder)=>{

            const {name} = cur_log_folder;

            condensed_obj[name] = condensed_obj[name]===undefined ? [] : condensed_obj[name];

            cur_log_folder.children.forEach((cur_file)=>{

                const line_arr = cur_file.content.split("\n");

                line_arr.forEach((cur_line)=>{

                    if( !condensed_obj[name].includes(cur_line) ){
                        condensed_obj[name].push(cur_line);
                    }
                });
            });

        });

    });

    return condensed_obj;
}

function expandFolder( path, file_contents=false ){

    // console.log(path)
    
    helpers.checkFolderExists( path );

    let type;
    let children;
    let content;

    path = removeTrailingSlash(path);

    try{
        children = fs.readdirSync( path );
        type = "folder";
    }catch(e){
        if( file_contents===true ){
            content = fs.readFileSync(path).toString();
        }
        type = "file";
        // assume its a file
    }

    if( children!==undefined ){
        children = children.map((cur_child,i,arr)=>{
            const expanded_child_dir = `${path}/${cur_child}`
            const expanded_child = expandFolder(expanded_child_dir, file_contents);
            return {
                ...expanded_child,
                name: cur_child,
            }
        });
    }

    return {
        path,
        children, 
        content, 
        type,
    }
}

function removeTrailingSlash(path){
    // remove trailing slash
    if( path[path.length-1]==="/" ){
        path = path.substring(0, path.length-2);
    }
    return path;
}

function execPromise(command, options){
    return new Promise((resolve, reject)=>{

        if(options!==undefined){
            const resp = execSync(command, options)
            resolve(resp);
        }else{
            const resp = execSync(command)
            resolve(resp);
        }

    });
}