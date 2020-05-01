/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/*
MIT License
Copyright (c) 2020 International Business Machines

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import * as path from 'path';
import * as vscode from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient';

var fetch = require('node-fetch');

interface Plan {
	name: string;
	description: string;	
}
interface Service {
	name: string;
	displayName: string;
	id: string;
	description: string;
	planUpdateable: boolean;
	plans: Plan[];
}

const g_homedir = require('os').homedir();
const g_catalogPath = `${g_homedir}/.vscode/extensions/kubecrd-vscode-extension-0.0.1/ibmcloud/`;

const fetchCatalog = async (url: string): Promise<any | string> => {
	try {
		var response = await fetch(url);
		var data = await response.json();
		console.log(`limit=${data.limit}, count=${data.count}, resource_count=${data.resource_count}`);
		return data;
	} catch (error) {
		if (error) {
			return error.message;
		}
	}
};

const fetchPlans = async (url: string): Promise<any> => {
	//console.log('fetch plans: ' + url);
	var plans: Plan[] = [];
	try {
		var response = await fetch(url);
		var data = await response.json();
		console.log(`fetch plans for servicename=${data.name}`);
		for(var i=0; i<data.children.length; i++){
			if(data.children[i].kind === 'plan' && data.children[i].active === true && data.children[i].disabled === false){
				plans = plans.concat({name: data.children[i].name,
					description: data.children[i].overview_ui.en.description});
			}
		}
		return plans;
	} catch (error) {
		if (error) {
			return null;
		}
	}
};

const send2Output = async (services: any): Promise<any> => {
	console.log('sending to Output channel ');
	var plansString;
	try {
		var outputChannel = vscode.window.createOutputChannel('IBM Cloud Services & Plans');
		console.log(`open output channel`);
		outputChannel.show();
		for(var i=0; i<services.length; i++){
			plansString = '';
			for(var j=0; j<services[i].plans.length; j++){
				plansString += services[i].plans[j].name + ', ';				
			}
			if(services[i].plans.length > 0) {
				plansString = plansString.substring(0, plansString.length-1); //remove the last ","
				outputChannel.append(`${i + 1}\t service class: ${services[i].name}\t\tplan(s): ${plansString}\n`);
			} else {
				outputChannel.append(`${i + 1}\t service class: ${services[i].name}\t\t(no plans)\n`);
			}
		}
		console.log(`end of output channel`);
	} catch (error) {
    	console.log(`send2Output error: ${error}`);
	}
};

async function delay(milliseconds: number) {
	return new Promise<void>(resolve => {
		setTimeout(resolve, milliseconds);
	});
}

const createCatalogCache = async () => {
	const url = 'https://globalcatalog.cloud.ibm.com/api/v1';
	var offset = 0; //set to 400 for testing
	var total = 500; //will be set to the real count from the catalog response 
	var resources: any[] = [];
	var services: Service[] = [];
	var plans: Plan[] = [];
	var fs = require('fs');
	var catalogPage;
	console.log(`ibmcloud service catalog = ${g_catalogPath}`);

	try {
		//get the catalog entries page by page
		while (offset < total) {
			console.log(`calling: ${url}?_offset=${offset}`);
			catalogPage = await fetchCatalog(url + '?_offset=' + offset);
			resources = resources.concat(catalogPage.resources);
			console.log(`#resources = ${resources.length}`);
			offset += catalogPage.resource_count;
			total = catalogPage.count;
		}
		fs.writeFileSync(`${g_catalogPath}catalog.json`, JSON.stringify(resources), 'utf8');
		console.log(`ibmcloud global catalog is saved to ${g_catalogPath}catalog.json`);

		//parse services from the catalog entries
		for (var i=0; i < resources.length; i++){
			if(resources[i].kind === 'service' && resources[i].active === true && resources[i].disabled === false){
				var service: Service;
				if(resources[i].group === true) {
					for (var j=0; j < resources[i].children.length; j++){
						if(resources[i].children[j].kind === 'service'){
							//get plans by service id (not service name)
							plans = await fetchPlans(url + '/' + resources[i].children[j].id + '?depth=*&include=*');
							if(plans === null){
								plans = [];
							}
							service = {name: resources[i].children[j].name, 
								id: resources[i].children[j].id,
								displayName: resources[i].children[j].overview_ui.en.display_name,
								description: resources[i].children[j].overview_ui.en.description,
								planUpdateable: resources[i].children[j].metadata.service.plan_updateable,
								plans:  plans 
							};
							services = services.concat(service);
						}
					}
				} else{
					plans = await fetchPlans(url + '/' + resources[i].id + '?depth=*&include=*');
					if(plans === null){
						plans = [];
					}
					service = {name: resources[i].name, 
							   id: resources[i].id,
							   displayName: resources[i].overview_ui.en.display_name,
							   description: resources[i].overview_ui.en.description,
							   planUpdateable: resources[i].metadata.service.plan_updateable,
							   plans:  plans 
					};
					services = services.concat(service);
				}
				vscode.window.showInformationMessage(`loading service and plans ... ${i}/${resources.length}`);
				await delay(5000); //wait for 5 seconds before calling for plans
			}
		}
		//console.log(`total #services = ${services.length}`);
		fs.writeFileSync(`${g_catalogPath}servicesCatalog.json`, JSON.stringify(services), 'utf8');
		vscode.window.showInformationMessage('IBM cloud catalog is loaded successfully. See Output channel "IBM Cloud Services" for services and plans.');
	
		await send2Output(services);
	} catch (error) {
		vscode.window.showInformationMessage(`Errors while loading IBM cloud service catalog: ${error.message}`);
	}

};

const showCatalogCache = async () => {
	var fs = require('fs');
	try {
		//get the catalog from local cache
		console.log(`read from local cache ./ibmcloud/servicesCatalog.json`);
		var servicesString = fs.readFileSync(`${g_catalogPath}servicesCatalog.json`, 'utf8');
		var services = JSON.parse(servicesString);	
		await send2Output(services);
	} catch (error) {
		vscode.window.showInformationMessage(`Errors while loading IBM cloud service catalog from cache: ${error.message}`);
	}
};

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ibmcloud service support" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.refreshibmcloudcatalog', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('loading IBM cloud service catalog ... ');
		//load ibm cloud service catalog
		createCatalogCache();
	});
	context.subscriptions.push(disposable);

	let disposable2 = vscode.commands.registerCommand('extension.showibmcloudcatalog', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('show IBM cloud service catalog in Output "IBM Cloud Services & Plans" channel ');
		//load ibm cloud service catalog
		showCatalogCache();
	});
	context.subscriptions.push(disposable2);

	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'yaml' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			//fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
			fileEvents: vscode.workspace.createFileSystemWatcher('**/*.yaml')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'IBM Cloud Service',
		'IBM Cloud Service Support',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

