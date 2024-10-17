# Sparnatural-yasgui-plugins
Set of Plugins for Yasgui / YASR useful in conjunction with [Sparnatural](https://github.com/sparna-git/Sparnatural)

For integration with Sparnatural, there is a [dedicated documentation page](https://docs.sparnatural.eu/YasGUI-plugins.html)

## The Plugins

### TableX plugin

This is an adaptation of the original YaSR Table plugin. Its main enhancement is that it can hide URI columns "behind" a correspondig label column, thus hiding technical URIs for end-users. The link URLs can also be customzed to navigate to another URL than the original URI.

For ever column `?xxx_label`, the plugin will look for a column `?xxx` having a literal property (for example `?Person_1` and `?Person_1_label`), and merge these columns. The merge is done on the SPARQL result set itself, by creating a new kind of result `x-labelled-uri` containing both the URI and its label.

Instead of this:


You would get this:

### Grid plugin

The Grid plugin works only in conjunction with Sparnatural, not for any SPARQL query. It needs to be notified of the Sparnatural original query, and the Sparnatural original configuration.
The Grid plugin:
- look for a main title column for each entity
- merges the lines in the result set with the same title
- displays the other columns in each card by replicating the original query structure from Sparnatural
- can look for an image column (containing URIs ending in `.png` or `.jpg`)

### Stats plugin

The Stats plugin can:
- display a simple COUNT query, with only an integer result
- generate simple pie or bar charts from a `COUNT` + `GROUP BY` query

### Timeline plugin

TODO

## Developers

1. Clone the code
2. Install dependencies : `npm install`
3. Run dev server : `npm run start`
4. Adjust the code in the test page (index.html) to test and include the plugin
