import { useCallback, useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import Link from 'next/link';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setPosts([...posts, ...postsPagination.results]);
  }, [postsPagination.results]);

  const handleShowMore = useCallback(async () => {
    if (postsPagination.next_page) {
      const data = await fetch(postsPagination.next_page);
      const response = await data.json();
      setPosts([...posts, ...response.results]);
    }
  }, [postsPagination.next_page, posts]);

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <main className={styles.contentContainer}>
        <section className={styles.home}>
          <img src="/images/logo.svg" alt="logo" />

          <div className={styles.posts}>
            {posts.map(post => (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <h2>{post.data.title}</h2>
                  <p>{post.data.subtitle}</p>
                  <div className={styles.info}>
                    <time>
                      <FiCalendar size={20} />{' '}
                      {format(
                        new Date(post.first_publication_date),
                        'dd LLL yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                    <span>
                      <FiUser size={20} />
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            ))}
          </div>

          {postsPagination.next_page ? (
            <button type="button" onClick={handleShowMore}>
              Carregar mais posts
            </button>
          ) : null}
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { fetch: ['post.title', 'post.subtitle', 'post.author'] }
  );

  const posts = postsResponse.results.map((post: any) => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
