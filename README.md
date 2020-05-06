# A VS Code Extension for IBM Cloud Service CRDs

This extension provides kubernetes CRD templates and validation to help developers easily create and debug Custom Resource (CR) yaml specifications in IDE.

## Features

* Custom resource templates

* Custom resource specification validation

* Auto complete feature for IBM Cloud Service classes and plans

* Cross resource dependency check (ToDo)

## Release Notes

### 0.0.1

Initial release including support for the following:

* CRD schemas and validation

  - Knative Eventing CRDs (samples of those having schema defined in CRD yaml)
  - iter8 CRD
  - IBM Cloud Service CRDs

* Custom resource specification templates

* Auto completion and validation for IBM Cloud Service classes and plans

## Requirements

This extension requires YAML Language Support extension by RedHat.

You may also install Microsoft Kubernetes Tools extension if you want to edit Kubernetes core resources. 

## Install

You need the github.ibm.com token to access the repository, please [get your github token](https://github.ibm.com/settings/tokens) and set it in `IBM_GITHUB_TOKEN`. Then, run:

```
curl -sL 'https://raw.githubusercontent.com/IBM/kubecrd-vscode-extension/master/hack/install.sh' | bash 
```

This will install the CRD validation extention to VS Code directory at `~/.vscode/extentions/crd-validation-tool-xxx`.

Start or restart VS Code to have it take effect.


## Configure Extension Settings

Open VS Code settings.json. `File -> Preferences -> Settings -> Extensions -> Scroll down and find "Edit in settings.json"`

Add the following entry to asociate the CRD schemas from this extension with the yaml files in a glob pattern. Then Save the change. (This instructs VS Code to apply the schemas to the yaml files of the naming patterns)

```
    "yaml.schemas": {
        "file:///<path of schemas json file>": ["<yaml files glob pattern>"]
    }
```

where 

`<path of schemas json file>` should be `<home_directory>/.vscode/extensions/crd-validation-tool-0.0.1/schemas/crd-definitions.json`; and 

`<yaml files glob pattern>` could be `*.eventing.yaml`, `*.iter8.yaml`, etc. 
    
An example is shown below.

```
    "yaml.schemas": {
        "file:///<user home directory>/.vscode/extensions/crd-validation-tool-0.0.1/schemas/crd-definitions.json": ["*.eventing.yaml", "*.iter8.yaml"],
        "file:///<user home directory>/.vscode/extensions/crd-validation-tool-0.0.1/schemas/ibmcloud-crd-definitions.json": ["*.ibmcloud.yaml"]
    }

```

## Test

You can try it out by creating a yaml file named e.g. test.eventing.yaml. Pressing Ctl + Space keys will display a pop-up menu for templates and suggestions.

## Uninstall

Run the following command to remove the extension.

```
curl -sL 'https://raw.githubusercontent.com/IBM/kubecrd-vscode-extension/master/hack/uninstall.sh' | bash 
```

