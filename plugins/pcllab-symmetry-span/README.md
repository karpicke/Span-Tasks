# Spatial Plugin

The spatial plugin can be used for displaying spatial grid layouts of images for both study and recall trials. It has a wide variety of customization options. This plugin is an active work in progress, so all of this may change in the near future.

## Plugin Parameters

This plugin is broken up into multiple displays, which can be either study or recall displays. Plugin parameters are provided directly to the plugin.

|Name|Type|Default Value|Description|
|----|----|-------------|-----------|
|title|string|Spatial Recall|This title will appear above the plugin.|
|url|string|null|This is a URL to a JSON file with an array of display objects with parameters specified below. See examples.|
|displays|array|null|Instead of loading from a JSON file, displays can also be loaded dynamically from JavaScript code. This is an array of display objects specified below.|

## Display Parameters

Display parameters can either be saved into an external JSON file with an array of objects containing the parameters, or an array of objects can be passed in to the display property specified above.

|Name|Type|Default Value|Description|
|----|----|-------------|-----------|
|cue|array|[]|An array of strings containing paths to all of the image files to display as cues in this grid.|
|target|array|[]|An array of strings containing paths to all of the image files to display as target in this grid. Can only be used in canvas mode.|
|use_canvas|boolean|false|Set to true if you wish to use canvas mode as described in sections below.|
|column_count|number|0|The number of columns the grid should have. Row count is calculated based on this value.|
|type|string|study|Type of display. Either "study" or "recall"|
|instructions|string|To which does this belong?|Prompt to the user for a recall trial display.|
|shuffle|boolean|false|Should the grid be shuffled? Only use this in study trials for now, shuffled grid will be used later in recall.|
|button_text|string|Submit|The button text for the button that appears after a recall trial.|
|maximum_time|numher|null|If specified, the trial will only run for this amount of time in ms.|
|properties|object|See below|Pass in an properties object to customize different display attributes of the grid. See below for possible display properties.|

**Note:**
Defining cues is optional for recall trials. Recall trials can automatically use cues and targets from the earlier study trial. This is especially good for grids that are randomized in earlier study trials that later need to be recalled.
## Trial Types
This plugin supports both recall and study phases and can run multiple trials as one plugin, or trials can be spaced out between multiple plugins **(passing grids between multiple instances is still a WIP, update once finished)**. Trials can be defined in a separate JSON file as displays which the plugin can execute.
* **Study Mode:** A grid of pictures is displayed to the user, with either a single grid of images, or cue and target overlayed.
* **Recall Mode:** A grid of only either blank spaces or targets is shown, and the user must recall the location of the cue on the grid.
## Display Modes
This plugin has two display modes. This is different from the trial type, and the display mode affects both study and recall trials. Only the canvas mode supports both cue and target images for a single grid.

### Default Grid Mode
The default grid mode will use a grid of HTML `<img>`s arranged in a card format. It is the default option and is already in use by default. It doessn't have as many customization options, but it will display images in however many columns are specified. Recall is done by recalling the position of a cue stimulus on a blank grid.

<img src="/pcllab-spatial/example/exampleGrid.png?raw=true" width="600">

### Canvas Mode
The canvas  mode will use a HTML5 Canvas with 2D rendering context. It is designed for more specific experiments that require many customizations to be made. It allows for overlaying cue and target images, modifying image positions within the grid, removing image backgrounds, and having background colors and images. Study trials are done by displaying a grid of both cues and targets overlayed on each other. Recall is done by showing a grid of only target images and matching the cue image with its position on the grid.

<img src="/pcllab-spatial/example/exampleCanvas.png?raw=true" width="700">

## Rendering Parameters
These parameters will go in the `properties` field and will change how items are displayed in the grid. Most parameters are only for canvas mode, which uses a more dynamic rendering technique for displaying customized grids.

### Canvas Mode Properties

|Name|Type|Default Value|Description
|----|----|-------------|-----------
|targetOffsetX|number|0|Horizontal offset in pixels of the target image from the top left.|
|targetOffsetY|number|0|Vertical offset in pixels of the target image from the top right.|
|cueOffsetX|number|48|Horizontal offset in pixels of the cue image from the top left.|
|cueOffsetY|number|32|Vertical offset in pixels of the cue image from the top right.|
|targetPadding|number|0|Padding around the target image in pixels.|
|cuePadding|number|0|Padding around the cue image in pixels.|
|backgroundColor|string|#B2DFDB|Background color for recall grid canvas area.|
|backgroundAlpha|number|255|Transparency of background of recall grid canvas area. Set to 0 if using a background image. Range 0-255, 0 invisible, 255 fully opaque|
|borderColor|string|#1E88E5|Color of border drawn around selected targets during recall trials.|
|borderThickness|number|6|Thickness in pixels of border drawn around selected targets.|
|cueTransparent|boolean|true|Whether the cue image should have a transparent background.|
|targetTransparent|boolean|true|Whether the target image should have a transparent background.|
|transparentColor|string|#FFFFFF|The background color which should be removed from cue and target images. By default, it removes white backgrouds.|
|cueTolerance|string|48|Tolerance range of colors to be removed for the cue image. More tolerance means more colors removed, less tolerance means color removal more strict. Prevents random pixels from appearing. Range 0-255|
|targetTolerance|string|48|Tolerance range of colors to be removed for the target image. More tolerance means more colors removed, less tolerance means color removal more strict. Prevents random pixels from appearing. Range 0-255|

### Default Grid Mode Properties

|Name|Type|Default Value|Description|
|----|----|-------------|-----------|
|renderDelay|number|300|Slight delay to ensure that all pictures appear at the same time after they are loaded. Occurs after every picture has reached a loaded state.|

## Output
The output has the following parameters:

|Name|Type|Description|
|----|----|-----------|
|title|string|Title of the display shown.|
|rt|number|Response time for a the prompt.|
|type|string|Either "Recall" or "Study" depending on the display.|
|cue|string|The message displayed to the user (different from cue image).|
|stimulus|string|The image file of the cue image prompted.|
|target|string|The coordinate of the target on the grid.|
|response|string|The coordinate of the grid selected by the user.|
|correct|number|0 if incorrect, 1 if correctly matched.|

Most of these are omitted in a study trial, except for `title`, `rt`, and `type`.
#### Output Coordinates
Output coordinates are similar to an excel spreadsheet, where the columns are labeled A, B, C, ... etc. and rows are labeled numerically. So the first cell on the top left cell would be A1. Here is an example of a 3x3 grid:

| |A |B |C |
|-|--|--|--|
|1|A1|B1|C1|
|2|A2|B2|C2|
|3|A3|B3|C3|

**Example output item from a single response in a recall trial:**
```js
{
  "title": "Title",
  "rt": 2960,
  "type": "Recall",
  "cue": "Which house does this alien live in?",
  "stimulus": "Set1A01-C.25.cmp.jpg",
  "target": "E1",
  "respose": "E1",
  "correct": 1,
  "trial_type": "pcllab-spatial",
  "trial_index": 0,
  "time_elapsed": 7669,
  "internal_node_id": "0.0-0.0"
 },
 ```
