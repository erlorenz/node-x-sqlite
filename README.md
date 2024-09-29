# X-SQLite

## A wrapper around the experimental built-in Node SQLite driver.

The goal of this project is a reference to add some functionality to the built-in driver.
Currently it has some convenience methods that use tagged template literals to simplify preparing and executing a statement.

By default it opens in WAL mode if the target is a file.

### TODO:

[ ] More robust transactions with savepoints
