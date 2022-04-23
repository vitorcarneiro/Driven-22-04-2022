import fs from 'fs';
import pkg from '@prisma/client';
import { Parser } from 'json2csv';
import yaml from "json-to-pretty-yaml";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function sqlToJson(columnName, parameter) {
    let where = {};
    where[columnName] = parameter;

    const sponsoredReposJS = await prisma.repositories.findMany({ where });
    
    fs.writeFileSync('sponsored-repos.json', JSON.stringify(sponsoredReposJS, null, ' '), function (err) {
        if (err) throw err;
        console.log('error creating sponsored-repos.json!');
    });
}

function convertJsonFileToCsv(filePath) {

    const jsonObj = JSON.parse(fs.readFileSync(filePath, {encoding:'utf8', flag:'r'}).toString());

    const sortedReposByStars = jsonObj.sort((a, b) => parseInt(b.stars) - parseInt(a.stars));
    
    const fields = ['name', 'owner', 'description', 'topic', 'language', 'stars'];
    const opts = { fields };

    try {
        const parser = new Parser(opts);
        const csv = parser.parse(sortedReposByStars);

        fs.writeFileSync('most-famous-sponsored-repos.csv', csv, function (err) {
            if (err) throw err;
            console.log('error creating most-famous-sponsored-repos.csv!');
        });
    
      } catch (err) {
        console.error(err);
      }
}

async function typeScriptToJson() {
    const typeScriptReposJs = await prisma.repositories.findMany(
        {
            where : {
                language: 'TypeScript',
                tags: {
                    contains: 'react'
                }
            }
        });

        const typeScriptRepos = typeScriptReposJs.map((repo) => ({
            url: `https://github.com/${repo.fullName}`,
            description: repo.description,
            tags: mapTagStringToArray(repo.tags)
        }));

        fs.writeFileSync('typescript-repos.json', JSON.stringify(typeScriptRepos, null, ' '),
            function (err) {
                if (err) throw err;
                console.log('error creating typescript-repos.json!');
            }
        );
}

function jsonToYaml(filePath) {
    const jsonObj = JSON.parse(fs.readFileSync(filePath, {encoding:'utf8', flag:'r'}).toString());

    const yamlData = yaml.stringify({ repositories: jsonObj });
    fs.writeFileSync("react-typescript-repos.yaml", yamlData);

}

function mapTagStringToArray(tags) {
    const tagsArray = [];
    let string = "";
    for (let i = 0; i < tags.length; i++) {
        if(tags[i] !== '"' && tags[i] !== '[' && tags[i] !== ']' && tags[i] !== ',' && tags[i] !== "'" && tags[i] !== ' ' && tags[i] !== '') {
            string = string + tags[i];
        
        } else {
            tagsArray.push(string);
            string = "";
        }
    }

    const newTagArray = [];
    for (let i = 0; i < tagsArray.length; i++) {
        if (/^[a-zA-Z0-9_.-]*$/.test(tagsArray[i]) && tagsArray[i].length > 1) {
            newTagArray.push(tagsArray[i]);
        }
    }
    
    return newTagArray;
  }

sqlToJson("hasSponsorship", true);
convertJsonFileToCsv('sponsored-repos.json');
typeScriptToJson();
jsonToYaml('typescript-repos.json');