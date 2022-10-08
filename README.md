# COMP0160 Psychophysics Labs

Development repo for some simple web-based psychophysics experiments
for use in the lab sessions for weeks 1-4 of the module. These will
eventually be deployed to our
[GitHub Pages site](https://comp0160.github.io).

Experiments are implemented in JavaScript with [jsPsych](https://www.jspsych.org/)
using [jsPsych Builder](https://github.com/bjoluc/jspsych-builder) to automate the
development setup. [Chart.js](https://www.chartjs.org/docs/latest/) is used to plot
results and [FileSaver](https://github.com/eligrey/FileSaver.js/) to download them.

Building and running requires [npm](https://docs.npmjs.com/about-npm). Clone this repo,
cd into the top-level directory and install dependencies with:

```sh
npm install
```

To run an experiment use:

```sh
npm start <name>
```

Then go to [localhost:3000](http://localhost:3000) in your web browser.

Currently available experiments are:

* `const_stim`: estimating the threshold of detection for light spots against a
  dark background using the [method of constant stimuli](https://en.wikipedia.org/wiki/Psychophysics#Method_of_constant_stimuli)

This is very much a work in progress, more experiments will be added soon!