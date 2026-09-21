import { Button, Result } from 'antd'
import { Link } from 'react-router-dom'

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
