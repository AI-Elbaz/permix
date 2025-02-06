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
          <h2>
            Post
            {' '}
            {post.id}
          </h2>
          Can I edit the post where authorId is
          {post.authorId}
          ?
          <br />
          {check('post', 'edit', post) ? 'Yes' : 'No'}
          <br />
          <Check
            entity="post"
            action="edit"
            data={post}
            otherwise="I don't have permission to edit a post inside the Check component"
          >
            I can edit a post inside the Check component
          </Check>
          <hr />
        </div>
      ))}
    </>
  )
}

export default App
