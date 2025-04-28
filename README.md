## Legend:

  **WMU** - Wildlife Management Unit

  **MNRF** - Ministry of Natural Resources and Forestry


# How to use the app:

The current deployment of the website can be found here [ON-Hunting-Map](https://onhuntingmap.netlify.app/)

* This website displays Ontario annual hunter harvesting data for each WMU

* Searching for a WMU in the search bar will zoom to the location of that WMU

* Any species which the MNRF tracks harvesting for is available in the species selection dropdown

* The year can also be selected to see the harvest number for a species in a specific year

* The 'harvested per hunter' checkbox shows the number of animals harvested divided by the number of active hunters in the given WMU. This can
be a good estimate for the hunting success rate in a certain WMU.

* When hovering over a WMU, the line graph for the selected species will appear on the right to show how the number of animals harvested has
changed each year.

* The WMUs are colour coded using a range of 50 colours from red to green where red indicates a lower number and green indicates a higher number.

* The harvesting numbers will be displayed when the WMU is hovered over on desktop or tapped on your mobile device.

* Some WMUs are split into sub-WMUs (i.e. WMU 78D, WMU 92A) but sometimes harvesting data only exists parent WMUs and not sub-WMUs. In this case,
  the sub-WMUs are grouped together on the map and the harvesting data for the parent WMU (i.e. WMU 72, WMU 92) is shown instead. This is why it may seem
  like some species are being harvested in city centres. 

# How to contribute to this app

Contributions to ON-Hunting-Map are welcome, particularly to `script.js`, which powers the interactive map. 
Whether fixing bugs, adding features, or improving the UI, your help is appreciated!

## Finding Issues

* Browse the Issues tab for bugs or enhancements

* Propose new ideas by creating an issue with a clear title and description

* Comment to claim an issue and get approval from @hennessyaedan

## Formatting

* Make sure to use camelCase when declaring variables (i.e. harvestData)

* Use const for constants and let for reassignments

*  Match indentation with existing code (ususally 2 spaces)

*  Add a brief commment to the top of any code blocks to describe their function

*  When necessary, add comments to explain any complex logical operations.

## Submitting Changes

* **Create a branch:** i.e. git checkout -b fix/wmu-search.

* **Commit with clear messages:** i.e git commit -m "Fixed WMU search case sensitivity (#123)".

* **Push:** i.e. git push origin fix/wmu-search.

* Pull request titles and commit messages should be clear and concise (i.e. "Fix WMU Search (#123)")

* If the pull request includes the solution of an issue, the issue should be referenced in the description

* Include screenshots if submitting changes or enhancements to the UI



