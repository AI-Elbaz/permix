import { useEffect } from 'react'
import { usePermissions } from './hooks/permissions'
import { usePosts } from './hooks/posts'
import { useUser } from './hooks/user'
import { Check, setupPermix } from './lib/permix'
import './App.css'

function App() {
  const user = useUser()
  const { check, isReady } = usePermissions()
  const posts = usePosts()

  useEffect(() => {
    if (user) {
      setupPermix(user)
    }
  }, [user])

  return (
    <>
      Is Permix ready?
      {' '}
      {isReady ? 'Yes' : 'No'}
      <hr />
      My user is
      {' '}
      {user?.id ?? '...'}
      <hr />
      {posts.map(post => (
        <div key={post.id}>
          Can I edit the post where authorId is
          {' '}
          {post.authorId}
          ?
          {' '}
          {check('post', 'edit', post) ? 'Yes' : 'No'}
        </div>
      ))}
      <hr />
      <Check entity="post" action="edit" else={<div>You don't have permission to edit a post</div>}>
        Can I edit a post inside the Check component?
      </Check>
    </>
  )
}

export default App
