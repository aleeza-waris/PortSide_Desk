import { Button, Result } from 'antd'
import { Link, useRouteError } from 'react-router-dom'

export function NotFound() {
  return (
    <Result
      status="404"
      title="Page not found"
      subTitle="This address does not match anything in Portside Desk."
      extra={
        <Link to="/">
          <Button type="primary">Back to overview</Button>
        </Link>
      }
    />
  )
}

/** Shown inside the layout when a page throws, so the sider and header stay usable. */
export function RouteError() {
  const error = useRouteError()
  return (
    <Result
      status="500"
      title="This page failed to load"
      subTitle={error instanceof Error ? error.message : 'Something unexpected happened.'}
      extra={<Button type="primary" onClick={() => window.location.reload()}>Reload page</Button>}
    />
  )
}
