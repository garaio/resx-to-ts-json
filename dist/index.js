"use strict";
var addTypeScriptFile = require('add-typescript-file-to-project');
var fs = require('fs');
var mkpath = require('mkpath');
var search = require('recursive-search');
var xml2js = require('xml2js');
var virtualProjectRoot = '\\..\\';
function executeResxToTsTranslationKeys(typeScriptResourcesNamespace, virtualResxFolder, virtualTypeScriptFolder, fileNameRegex) {
    if (fileNameRegex === void 0) { fileNameRegex = /.resx$/; }
    var files = getFilesFromFolder(virtualResxFolder, fileNameRegex);
    if (files !== undefined && files !== null) {
        for (var i = 0, length_1 = files.length; i < length_1; i++) {
            var resxFilename = files[i];
            convertResxToTypeScriptModelTranslationKeys(resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder);
        }
    }
}
exports.executeResxToTsTranslationKeys = executeResxToTsTranslationKeys;
function executeResxToTs(typeScriptResourcesNamespace, virtualResxFolder, virtualTypeScriptFolder, fileNameRegex) {
    if (fileNameRegex === void 0) { fileNameRegex = /.resx$/; }
    var files = getFilesFromFolder(virtualResxFolder, fileNameRegex);
    if (files !== undefined && files !== null) {
        for (var i = 0, length_2 = files.length; i < length_2; i++) {
            var resxFilename = files[i];
            convertResxToTypeScriptModel(resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder);
        }
    }
}
exports.executeResxToTs = executeResxToTs;
function executeResxToJson(virtualResxFolder, virtualJsonFolder, fileNameLanguage, fileNameRegex) {
    if (fileNameRegex === void 0) { fileNameRegex = /.resx$/; }
    var files = getFilesFromFolder(virtualResxFolder, fileNameRegex);
    if (files !== undefined && files !== null) {
        for (var i = 0, length_3 = files.length; i < length_3; i++) {
            var resxFilename = files[i];
            convertResxToJson(resxFilename, virtualJsonFolder, fileNameLanguage);
        }
    }
}
exports.executeResxToJson = executeResxToJson;
function getFilesFromFolder(virtualResxFolder, fileNameRegex) {
    var files = null;
    if (virtualResxFolder === undefined || virtualResxFolder === '') {
        files = search.recursiveSearchSync(fileNameRegex, __dirname + virtualProjectRoot);
    }
    else {
        virtualResxFolder = virtualResxFolder.replace(/\//g, '\\');
        var safeVirtualFolder = virtualResxFolder;
        if (safeVirtualFolder.charAt(0) === '\\') {
            safeVirtualFolder = safeVirtualFolder.substr(1);
        }
        if (safeVirtualFolder.charAt(safeVirtualFolder.length - 1) === '\\') {
            safeVirtualFolder = safeVirtualFolder.substr(0, safeVirtualFolder.length - 1);
        }
        files = search.recursiveSearchSync(fileNameRegex, __dirname + virtualProjectRoot + safeVirtualFolder);
    }
    if (files !== undefined && files !== null) {
        var filesAsString = JSON.stringify(files).replace('[', "").replace(']', "");
        var splittedFiles = filesAsString.split(',');
        var cleanedFiles = splittedFiles.map(function (fileName) { return fileName.trim().replace(/"/g, "").replace(/\\\\/g, "\\"); });
        return cleanedFiles;
    }
}
function convertResxToTypeScriptModel(resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder) {
    fs.readFile(resxFilename, function (err, data) {
        var parser = new xml2js.Parser();
        parser.parseString(data, function (err, result) {
            if (result !== undefined) {
                convertXmlToTypeScriptModelFile(result, resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder);
            }
        });
    });
}
function convertResxToTypeScriptModelTranslationKeys(resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder) {
    fs.readFile(resxFilename, function (err, data) {
        var parser = new xml2js.Parser();
        parser.parseString(data, function (err, result) {
            if (result !== undefined) {
                convertXmlToTypeScriptModelFileTranslationKeys(result, resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder);
            }
        });
    });
}
function convertResxToJson(resxFilename, virtualJsonFolder, fileNameLanguage) {
    fs.readFile(resxFilename, function (err, data) {
        var parser = new xml2js.Parser();
        parser.parseString(data, function (err, result) {
            if (result !== undefined) {
                convertXmlToJsonFile(result, resxFilename, virtualJsonFolder, fileNameLanguage);
            }
        });
    });
}
function convertXmlToDictionary(xmlObject) {
    var dictionary = {};
    if (xmlObject.root.data !== undefined) {
        for (var i = 0, nrOfResourcesInFile = xmlObject.root.data.length; i < nrOfResourcesInFile; i++) {
            var key = xmlObject.root.data[i].$.name; // 
            var value = xmlObject.root.data[i].value.toString();
            parseToDictionaryItem(key, value, dictionary);
        }
    }
    return dictionary;
}
function parseToDictionaryItem(key, value, dictionary) {
    if (!dictionary) {
        dictionary = {};
    }
    if (!key.length) {
        return;
    }
    dictionary[key] = value;
}
function convertDictionaryToTsMapping(dictionary, nest) {
    var nestedTabs = "";
    for (var i = 0; i < nest; i++) {
        nestedTabs += "\t";
    }
    var childNestedTabs = nestedTabs + "\t";
    var result = "{\n";
    var keys = Object.keys(dictionary);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = dictionary[key];
        result += childNestedTabs + "public static readonly " + key + " = `" + value + "`";
        result += ";\n";
    }
    result += nestedTabs + "}";
    return result;
}
function convertDictionaryToTsMappingTranslationKeys(typeScriptResourcesNamespace, dictionary, nest) {
    var nestedTabs = "";
    for (var i = 0; i < nest; i++) {
        nestedTabs += "\t";
    }
    var childNestedTabs = nestedTabs + "\t";
    var result = "{\n";
    var keys = Object.keys(dictionary);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = dictionary[key];
        result += childNestedTabs + "public static readonly " + key + " = `" + typeScriptResourcesNamespace + key + "`";
        result += ";\n";
    }
    result += nestedTabs + "}";
    return result;
}
function convertXmlToTypeScriptModelFile(xmlObject, resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder) {
    var projectRoot = getProjectRoot();
    var relativeResxFilename = resxFilename.replace(projectRoot, "").replace(/\\/g, "/");
    var className = resxFilename.substr(resxFilename.lastIndexOf("\\") + 1).replace('.resx', '').replace(".", "_");
    var content = '// TypeScript Resx model for: ' + relativeResxFilename + '\n' +
        '// Auto generated by resx-to-ts-json (npm package)' + '\n' + '\n' +
        '/* tslint:disable */\n' +
        '/* eslint-disable */\n' +
        '// ReSharper disable InconsistentNaming\n\n';
    content = content + 'declare module ' + typeScriptResourcesNamespace + ' {\n';
    content = content + '\texport class ' + className + ' ';
    var dictionary = convertXmlToDictionary(xmlObject);
    content = content + convertDictionaryToTsMapping(dictionary, 1);
    content = content + '\n}\n';
    // Write model if resources found
    if (Object.keys(dictionary).length > 0) {
        var tsFileName = resxFilename.replace('.resx', '.ts');
        if (virtualTypeScriptFolder === undefined || virtualTypeScriptFolder === '') {
            // Write the file aside of the the resx file.
            fs.writeFile(tsFileName, content, null);
            addTypeScriptFile.execute(tsFileName);
        }
        else {
            // Write the file to the given output folder.
            var tsFileNameWithoutPath = tsFileName.substr(tsFileName.lastIndexOf('\\') + 1);
            var outputFileName = (projectRoot + virtualTypeScriptFolder + '\\' + tsFileNameWithoutPath).split('/').join('\\');
            var relativeOutputFileName = virtualTypeScriptFolder + '/' + tsFileNameWithoutPath;
            console.log('convert ' + resxFilename + ' -> ' + outputFileName);
            mkpath.sync(projectRoot + virtualTypeScriptFolder, '0700');
            fs.writeFile(outputFileName, content, function () { });
            addTypeScriptFile.execute(relativeOutputFileName);
        }
    }
}
function convertXmlToTypeScriptModelFileTranslationKeys(xmlObject, resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder) {
    var projectRoot = getProjectRoot();
    var relativeResxFilename = resxFilename.replace(projectRoot, "").replace(/\\/g, "/");
    var className = resxFilename.substr(resxFilename.lastIndexOf("\\") + 1).replace('.resx', '').replace(".", "_");
    var content = '// TypeScript Resx model for: ' + relativeResxFilename + '\n' +
        '// Auto generated by resx-to-ts-json (npm package, modified by GARAIO)' + '\n' + '\n' +
        '/* tslint:disable */\n' +
        '/* eslint-disable */\n' +
        '// ReSharper disable InconsistentNaming\n\n';
    content = content + 'export class ' + className + ' ';
    var dictionary = convertXmlToDictionary(xmlObject);
    content = content + convertDictionaryToTsMappingTranslationKeys(typeScriptResourcesNamespace, dictionary, 0);
    // Write model if resources found
    if (Object.keys(dictionary).length > 0) {
        var tsFileName = resxFilename.replace('.resx', '.ts');
        if (virtualTypeScriptFolder === undefined || virtualTypeScriptFolder === '') {
            // Write the file aside of the the resx file.
            fs.writeFile(tsFileName, content, function () { });
            addTypeScriptFile.execute(tsFileName);
        }
        else {
            // Write the file to the given output folder.
            var tsFileNameWithoutPath = tsFileName.substr(tsFileName.lastIndexOf('\\') + 1);
            var outputFileName = (projectRoot + virtualTypeScriptFolder + '\\' + tsFileNameWithoutPath).split('/').join('\\');
            var relativeOutputFileName = virtualTypeScriptFolder + '/' + tsFileNameWithoutPath;
            console.log('convert translation keys' + resxFilename + ' -> ' + outputFileName);
            mkpath.sync(projectRoot + virtualTypeScriptFolder, '0700');
            fs.writeFile(outputFileName, content, function () { });
            addTypeScriptFile.execute(relativeOutputFileName);
        }
    }
}
function convertXmlToJsonFile(xmlObject, resxFilename, virtualJsonFolder, fileNameLanguage) {
    var projectRoot = getProjectRoot();
    var relativeResxFilename = resxFilename.replace(projectRoot, "").replace(/\\/g, "/");
    var dictionary = convertXmlToDictionary(xmlObject);
    var content = JSON.stringify(dictionary);
    // Write model if resources found
    if (Object.keys(dictionary).length > 0) {
        var relativeJsonFilename = relativeResxFilename.replace('.resx', '.json');
        var jsonFileName = resxFilename.replace('.resx', '.json');
        if (virtualJsonFolder === undefined || virtualJsonFolder === '') {
            // Write the file aside of the the resx file.
            fs.writeFile(jsonFileName, content, null);
        }
        else {
            // Write the file to the given output folder.
            var jsonFileNameWithoutPath = jsonFileName.substr(jsonFileName.lastIndexOf('\\') + 1);
            if (fileNameLanguage) {
                var fileNameWithoutExtension = jsonFileNameWithoutPath.substring(0, jsonFileNameWithoutPath.indexOf(".json"));
                jsonFileNameWithoutPath = fileNameWithoutExtension + "." + fileNameLanguage + ".json";
            }
            var outputFileName = (projectRoot + virtualJsonFolder + '\\' + jsonFileNameWithoutPath).split('/').join('\\');
            var relativeOutputFileName = virtualJsonFolder + '/' + jsonFileNameWithoutPath;
            mkpath.sync(projectRoot + virtualJsonFolder, '0700');
            fs.writeFile(outputFileName, content, function () { });
        }
    }
}
function getProjectRoot() {
    var splittedDirName = __dirname.split('\\');
    var splittedRootDirName = [];
    for (var i = 0, length_4 = splittedDirName.length - 1; i < length_4; i++) {
        splittedRootDirName.push(splittedDirName[i]);
    }
    return splittedRootDirName.join('\\');
}
function decapitalizeFirstLetter(input) {
    return input.charAt(0).toLowerCase() + input.slice(1);
}
function capitalizeFirstLetter(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}
//# sourceMappingURL=index.js.map