## bit-tabs

[![Build Status](https://travis-ci.org/bitovi-components/bit-tabs.svg?branch=master)](https://travis-ci.org/bitovi-components/bit-tabs)

A tabs widget that can be loaded by:

- StealJS + ES6
- npm / browserify / CJS
- RequireJS / AMD
- Standalone with CanJS and jQuery


## ES6 use

With StealJS, you can import this module directly in a template that is autorendered:

```html
<script type='text/stache' can-autorender>
	<can-import from="bit-tabs"/>
	
	<bit-tabs>
	    <bit-panel title="CanJS">
	      CanJS provides the MV*
	    </bit-panel>
	    <bit-panel title="StealJS">
	      StealJS provides the infrastructure.
	    </bit-panel>
  	</bit-tabs>
</script>

<script src='./node_modules/steal/steal.js'
	main="can/view/autorender/"></script>
```

Alternatively, you can import this module like:

```js
import "bit-tabs";
import can from "can";
import $ from "jquery";
import stache from "can/view/stache/stache";


var template = stache("<bit-tabs>"+
	"<bit-panel title='X'>X Content</bit-panel>"+
	"<bit-panel title='Y'> Y-Content</bit-panel>"+
"</bit-tabs>");

$("body").append(template());

```


## CJS use

Use `require` to load `bit-tabs` and everything else
needed to create a template that uses `bit-tabs`:

```js
var can = require("canjs");
var $ = require("jquery");

// Add's bit-tabs tag
require("bit-tabs");
// Use stache
require("canjs/view/stache/stache");


var template = can.stache("<bit-tabs>"+
	"<bit-panel title='X'>X Content</bit-panel>"+
	"<bit-panel title='Y'> Y-Content</bit-panel>"+
"</bit-tabs>");

$("body").append(template());

```

## AMD use

Configure the `can` and `jquery` paths and the `bit-tabs` package:

```html
<script src="require.js"></script>
<script>
	require.config({
	    paths: {
	        "jquery": "node_modules/jquery/dist/jquery",
	        "can": "node_modules/canjs/dist/amd/can"
	    },
	    packages: [{
		    	name: 'bit-tabs',
		    	location: 'node_modules/bit-tabs/dist/amd',
		    	main: 'lib/bit-tabs'
	    }]
	});
	require(["main-amd"], function(){});
</script>
```

Make sure you have the `css` plugin configured also!

Use bit-tabs like:

```js
define(["can", "jquery", "can/view/stache","bit-tabs"], function(can, $){
	var template = can.stache("<bit-tabs>"+
		"<bit-panel title='X'>X Content</bit-panel>"+
		"<bit-panel title='Y'> Y-Content</bit-panel>"+
	"</bit-tabs>");

	$("body").append(template());
});
```

## Standalone use

Load the `global` css and js files:

```html
<link rel="stylesheet" type="text/css" 
      href="./node_modules/bit-tabs/dist/global/bit-tabs.css">
      
<script src='./node_modules/jquery/dist/jquery.js'></script>
<script src='./node_modules/canjs/dist/can.jquery.js'></script>
<script src='./node_modules/canjs/dist/can.stache.js'></script>
<script src='./node_modules/bit-tabs/dist/global/bit-tabs.js'></script>
<script id='main-stache' text='text/stache'>
  <bit-tabs>
    <bit-panel title='X'>X Content</bit-panel>
    <bit-panel title='Y'>Y-Content</bit-panel>
  </bit-tabs>
</script>
<script>
  $("body").append( can.view("main-stache",{}) );
</script>
```
