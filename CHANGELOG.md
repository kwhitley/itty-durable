## Changelog
Until this library makes it to a production release of v1.x, **minor versions may contain breaking changes to the API**.  After v1.x, semantic versioning will be honored, and breaking changes will only occur under the umbrella of a major version bump.

- **v0.2.0** - added export { proxyDurable(binding, class?) } to create a proxied durable stub from a binding (e.g. env.COUNTER), used internally in { withDurables() } middleware
