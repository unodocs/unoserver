# Unoserver Web

Web server for converting files using [unoserver](https://github.com/unoconv/unoserver)

[![CI/CD](https://github.com/unodocs/unoserver/actions/workflows/main.yml/badge.svg)](https://github.com/unodocs/unoserver/actions/workflows/main.yml)
[![Publish](https://github.com/unodocs/unoserver/actions/workflows/publish.yml/badge.svg)](https://github.com/unodocs/unoserver/actions/workflows/publish.yml)
[![codecov](https://codecov.io/gh/unodocs/unoserver/graph/badge.svg?token=2LFC0WZCQE)](https://codecov.io/gh/unodocs/unoserver)

Once the container is up and running http://127.0.0:3000 provides a swagger interface.

This is perfect for local development, or running it on a private network in production.

> There is no authentication available, nor planned, never run this container on a public network
 
## Example

Using [Dockerhub Image](https://hub.docker.com/r/unodocsl/unoserver):

```sh
docker run -d -p 3000:3000 unodocsl/unoserver:latest

curl \
--request POST 'http://localhost:3000/convert/pdf' \
--form 'file=@"/path/to/file.docx"' \
-o my.pdf
```


Each release that is published comes in 2 flavors:
- light: contains the code base, starts unoserver
- fonts: includes the full set of google fonts, installed on the OS (considerably larger image), release is suffixed with `-fonts`

## Container Environment variables

| Variable             | Description                                                                | Default |
| -------------------- | -------------------------------------------------------------------------- | ------- |
| PORT                 | Application port                                                           | 3000    |
| MAX_WORKERS          | Maximum number of LibreOffice workers                                      | 8       |
| WORKER_JOB_TIMEOUT   | Time limit that 1 file conversion can run (ms)                             | 60000   |
| CONVERSION_RETRIES   | Number of retries for converting a file                                    | 3       |
| MAX_FAILED_STORED    | Defines how many of the latest failed conversions are kept on record       | 500     |
| BASE_PATH            | Prefix path                                                                |         |
| REQUEST_ID_HEADER    | The header name used to set the request-id                                 |         |
| REQUEST_ID_LOG_LABEL | Defines the label used for the request identifier when logging the request | reqId   |

You can pass values individually when starting up the container

```shell
docker run --rm -e MAX_WORKERS=8 -e CONVERSION_RETRIES=3 -p 3000:3000 unoserver:dev
```

Or you you pass a whole `.env` file:

```shell
docker run --rm --env-file ./env -p 3000:3000 unoserver:dev
```

## Development

To spin up the container for development use [VSCode Remote Containers](https://code.visualstudio.com/docs/devcontainers/containers) feature. See `.devcontainer/devcontainer.json` for reference.

If you need to support more custom fonts, you could add them to `fonts` folder.

Commands:

- `pnpm run dev` - runs the app in watch-mode, then you could access a Swagger UI from `http://0.0.0.0:3000`
- `pnpm run build && pnpm run start` - builds and starts a production version of the app
- `pnpm run validate` - runs linting, typechecking and formatting check
- `pnpm run test` - runs all the tests

### Building an image

This step will always be required if you want to bring your own fonts.

```sh
docker build --build-arg NODE_ENV=production --tag unoserver:dev .
docker run --rm -p 3000:3000 unoserver:dev
```

Optionally you could also include all the google fonts into your container (this increases the image considerably).

```sh
docker build --build-arg NODE_ENV=production --build-arg GOOGLE_FONTS=1 --tag unoserver:dev .
docker run --rm -p 3000:3000 unoserver:dev
```

## Thanks

- lynxtaa: for the [original implementation](https://github.com/lynxtaa/unoserver-web)
- [Contributers](https://github.com/unodocs/unoserver/graphs/contributors)
