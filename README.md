# IBM Transaction Analysis Workbench for z/OS sample dashboards

This repository contains job control language (JCL) that uses [IBM Transaction Analysis Workbench for z/OS](https://www.ibm.com/uk-en/marketplace/transaction-analysis-workbench-for-z)
to forward various log record types from z/OS to Elastic or Splunk, for use in sample dashboards.

The JCL is provided in the `docs/jcl` directory of this repository.

The sample Splunk dashboards are available in a Splunk app that you can get in two ways:

* From [Docker Hub](https://hub.docker.com/r/fundisoftware/taw-splunk), in a Docker image
* From [GitHub](https://github.com/fundisoftware/taw-splunk), as an app directory that you can add to your own Splunk installation

The sample Elastic dashboards are available from [Docker Hub](https://hub.docker.com/r/fundisoftware/taw-elastic/) in a Docker image.

For an introduction to the sample dashboards, watch the YouTube video "[IBM Transaction Analysis Workbench for z/OS - Operations analytics dashboards in Splunk and Elastic](https://youtu.be/0Z30BxEqzJ8)".

For more information about the sample dashboards, including syntax-highlighted versions of the JCL listings, read the [documentation](http://fundisoftware.github.io/taw-sample-dashboards-jcl).
