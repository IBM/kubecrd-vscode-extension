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

import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';

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
export interface CloudServiceValidationResult {
	code: number;
	message?: string;
}
export interface PlanInfo {
	name: string;
	line: number;
	character: number;
}

export const ibmcloud_allInvalid: number = 0;
export const ibmcloud_allValid: number = 1;
export const ibmcloud_serviceOnlyValid: number = 2;
export const ibmcloud_catalogMissing: number = -1;

// ibmcloud service catalog cache
const ibmcloudCatalog = '/.vscode/extensions/kubecrd-vscode-extension-0.0.1/ibmcloud/servicesCatalog.json';
// ibmcloud service CRD group/version
export const CloudServiceApiVersion: string = 'ibmcloud.ibm.com/v1alpha1';
// ibmcloud service CRD kind
export const CloudServiceKind: string = 'Service';
// yaml segment marker
export const segmentMarker: string = '---';
// cache of ibmcloud services in json format
export let ibmcloudServices_json: Service[] = [];
// proposals cache for cloud services
export let serviceProposals: CompletionItem[] = [];

// get the end line of the current segment from the document containing multiple segments
export function getEndLine(document: TextDocument, line: number): number {
	//line: the line number of current "plan:"
	var myline = line;
	var str: string;
	while (true) {
		var myrange = { start: { line: myline, character: 0 }, end: { line: myline, character: 3 } };
		str = document.getText(myrange).trim();
		if (myline === document.lineCount) { //the segment end
			return myline;
		}
		else if (str === segmentMarker) {
			myline = myline - 1;
			return myline;
		}
		myline++;
	}
}

// get the start line of the current segment from the document containing multiple segments
export function getStartLine(document: TextDocument, line: number): number {
	//line: the line number of current "plan:"
	var myline = line;
	var str: string;
	while (true) { //find the segment start
		var myrange = { start: { line: myline, character: 0 }, end: { line: myline, character: 3 } };
		str = document.getText(myrange).trim();
		if (myline === 0) { //the segment start
			return 0;
		}
		else if (str === segmentMarker) {
			return myline + 1;
		}
		myline--;
	}
}

// get plan name and position for a related serviceClass at the line#
export function getPlan(document: TextDocument, line: number): PlanInfo {
	var name: string = '';
	var myline: number = 0;
	var character: number = 0;
	var startline = getStartLine(document, line);
	var endline = getEndLine(document, line);
	for (var i = startline; i <= endline; i++) {
		let myrange = { start: { line: i, character: 0 }, end: { line: i, character: 200 } };
		let mystr = document.getText(myrange);
		var myindex = mystr.indexOf('plan:');
		if (myindex > 0) {
			name = mystr.substring(myindex + 5).trim();
			myline = i;
			character = mystr.indexOf(name);
			break;
		}
	}
	return { name: name, line: myline, character: character };
}

// get ibmcloud catalog
export async function getIBMCloudCatalog() {
	// In this simple example we get the settings for every validate run.
	var fs = require('fs');
	const homedir = require('os').homedir();
	const filename = homedir + ibmcloudCatalog;
	console.log(`ibmcloud service catalog = ${filename}`);
	
	try {
		//get the catalog from local cache
		console.log(`read from local cache ./ibmcloud/servicesCatalog.json`);
		var servicesString = fs.readFileSync(filename, 'utf8');
		ibmcloudServices_json = JSON.parse(servicesString);
		var proposal: CompletionItem;
		for (var i = 0; i < ibmcloudServices_json.length; i++) {
			proposal = {
				label: ibmcloudServices_json[i].name,
				kind: CompletionItemKind.Enum,
				data: i + 1,
				detail: ibmcloudServices_json[i].description
			};
			serviceProposals = serviceProposals.concat(proposal);
		}
	}
	catch (error) {
		console.log(`Errors while loading IBM cloud service catalog from cache: ${error.message}`);
	}
}
// get all plans of an ibmcloud service
export function getPlans(document: TextDocument, line: number): CompletionItem[] {
	var servicename: string = '';
	var startline = getStartLine(document, line);
	var endline = getEndLine(document, line);
	for (var i = startline; i < endline; i++) {
		let myrange = { start: { line: i, character: 0 }, end: { line: i, character: 200 } };
		let myline = document.getText(myrange).trim();
		if (myline.startsWith('serviceClass:')) {
			servicename = myline.substring(13, myline.length).trim();
			break;
		}
	}
	let planProposals: CompletionItem[] = [];
	if (servicename === '') {
		return planProposals;
	}
	if (ibmcloudServices_json.length > 0) {
		var proposal: CompletionItem;
		for (var i = 0; i < ibmcloudServices_json.length; i++) {
			if (ibmcloudServices_json[i].name === servicename) {
				for (var j = 0; j < ibmcloudServices_json[i].plans.length; j++) {
					proposal = {
						label: ibmcloudServices_json[i].plans[j].name,
						kind: CompletionItemKind.Enum,
						detail: ibmcloudServices_json[i].plans[j].description,
						data: +1
					};
					console.log(`plan=${ibmcloudServices_json[i].plans[j].name}`);
					planProposals = planProposals.concat(proposal);
				}
				return planProposals;
			}
		}
	}
	return planProposals;
}
/*
// is the document (segment) an ibmcloud service yaml
export function isIBMCloudService(textDocument: TextDocument, startline: number, endline: number): boolean {
	var apiversion = '';
	var kind = '';
	for (var i = startline; i < endline; i++) {
		var myrange = { start: { line: i, character: 0 }, end: { line: i, character: 500 } };
		var mystring = textDocument.getText(myrange).trim();
		if (mystring.startsWith('apiVersion:')) {
			apiversion = mystring.substring(mystring.indexOf(':') + 1).trim();
		}
		else if (mystring.startsWith('kind:')) {
			kind = mystring.substring(mystring.indexOf(':') + 1).trim();
		}
	}
	if (apiversion === CloudServiceApiVersion && kind === CloudServiceKind) {
		return true;
	}
	else {
		return false;
	}
}
*/

// is the document (segment) an ibmcloud service yaml
export function isIBMCloudService(textDocument: TextDocument, line: number): boolean {
	var apiversion = '';
	var kind = '';
	var startline: number = getStartLine(textDocument, line);
	var endline: number = getEndLine(textDocument, line);
	for (var i = startline; i < endline; i++) {
		var myrange = { start: { line: i, character: 0 }, end: { line: i, character: 500 } };
		var mystring = textDocument.getText(myrange).trim();
		if (mystring.startsWith('apiVersion:')) {
			apiversion = mystring.substring(mystring.indexOf(':') + 1).trim();
		}
		else if (mystring.startsWith('kind:')) {
			kind = mystring.substring(mystring.indexOf(':') + 1).trim();
		}
	}
	if (apiversion === CloudServiceApiVersion && kind === CloudServiceKind) {
		return true;
	}
	else {
		return false;
	}
}

// validate serviceClass name and plan
export function validateServiceclassPlan(servicename: string, planname: string): CloudServiceValidationResult {
	var result: CloudServiceValidationResult = { code: ibmcloud_allInvalid, message: '' };
	var validPlans: string = '';
	if (ibmcloudServices_json.length > 0) {
		var proposal: CompletionItem;
		for (var i = 0; i < ibmcloudServices_json.length; i++) {
			if (ibmcloudServices_json[i].name === servicename) {
				result.code = ibmcloud_serviceOnlyValid;
				for (var j = 0; j < ibmcloudServices_json[i].plans.length; j++) {
					validPlans = validPlans + ibmcloudServices_json[i].plans[j].name + ', ';
					if (ibmcloudServices_json[i].plans[j].name === planname) {
						result.code = ibmcloud_allValid;
						result.message = `no error found`;
					}
				}
				break;
			}
		}
		if (result.code === ibmcloud_serviceOnlyValid) {
			result.message = 'invalid plan, the supported plans are: ' + validPlans.substring(0, validPlans.length - 2);
		}
		else if (result.code === ibmcloud_allInvalid) {
			result.message = 'invalid serviceClass and plan';
		}
	}
	else { //the catalog cache is missing
		result.code = ibmcloud_catalogMissing;
	}
	console.log(`validation result: service=${servicename}, code=${result.code}, message=${result.message}`);
	return result;
}