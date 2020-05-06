# A VS Code Extension for IBM Cloud Service CRDs

This extension provides Kubernetes Custom Resources (CR) templates, syntax validations, and content suggestions to help developers easily create and debug CR specifications in IDE.

In supporting to IBM Cloud CRs it integrates IBM Cloud Catalog and provides suggestions on the available services and plans.

## Features

* CR templates

* Syntax validation

* Suggestions from IBM Cloud Catalog for IBM CLoud Service CRs

![screencast](https://githubu.com/IBM/kubecrd-vscode-extension/master/images/demo.gif)

## Release Notes

### 0.0.1

Initial release including support for the following:

* CRD schemas and validation

  - IBM Cloud Service CRDs
  - Knative Eventing CRDs (those that have schema defined in CRD yaml)
  - iter8 CRD

* Templates

* Auto completion and validation for IBM Cloud Service classes and plans

## Requirements

This extension requires YAML Language Support extension by RedHat.

You may also install Microsoft Kubernetes Tools extension if you want to edit Kubernetes core resources. 

## Install

Run the following command to install:

```
curl -sL 'https://raw.githubusercontent.com/IBM/kubecrd-vscode-extension/master/hack/install.sh' | bash 
```

This will install the extention to VS Code directory at `~/.vscode/extentions/kubecrd-vscode-extension-0.0.1`.

Restart VS Code to activate the extension.


## Configure Extension Settings

Open VS Code settings.json. `File -> Preferences -> Settings -> Extensions -> Scroll down and find "Edit in settings.json"`

Add the following entry to asociate the CRD schemas from this extension with the yaml files in a glob pattern. Then Save the settings. (This instructs VS Code to apply the schemas to the yaml files of the naming patterns)

```
    "yaml.schemas": {
        "file:///<path of schemas json file>": ["<yaml files glob pattern>"]
    }
```

where 

`<path of schemas json file>` should point to the CRD schema files under `<home_directory>/.vscode/extensions/kubecrd-vscode-extension-0.0.1/schemas/`; and `<yaml files glob pattern>` could be `*.eventing.yaml`, `*.iter8.yaml`, `*.ibmcloudetc`. 
    
The extension contains three schema files:

* ibmcloud-crd-definitions.json

* knative-crd-definitions.json

* iter8-crd-definitions.json

A setting example  is shown below.

```
    "yaml.schemas": {
            "file:///Users/luan/.vscode/extensions/kubecrd-vscode-extension-0.0.1/schemas/ibmcloud-crd-definitions.json": ["*.ibmcloud.yaml"],
            "file:///Users/luan/.vscode/extensions/kubecrd-vscode-extension-0.0.1/schemas/iter8-crd-definitions.json": ["*.iter8.yaml"],
            "file:///Users/luan/.vscode/extensions/kubecrd-vscode-extension-0.0.1/schemas/knative-crd-definitions.json": ["*.kn.yaml"]
    }

```

## Test

You can try it out by creating a yaml file named e.g. test.eventing.yaml. Pressing Ctl + Space keys will display a pop-up menu for templates and suggestions.

## Uninstall

Run the following command to remove the extension.

```
curl -sL 'https://raw.githubusercontent.com/IBM/kubecrd-vscode-extension/master/hack/uninstall.sh' | bash 
```

