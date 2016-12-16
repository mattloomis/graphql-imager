# graphql-imager

Parse GraphQL shorthand and output HTML or DOT representations.

DOT representations can be converted to graph images by graphviz (www.graphviz.org) tools.


## Usage

To generate HTML:

    cat schema.graphql | node graphql-imager --html

To generate DOT:

    cat schema.graphql | node graphql-imager --dot | dot -Tpng > graph.png
    

