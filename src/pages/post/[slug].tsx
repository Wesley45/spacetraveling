import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';

import { useMemo } from 'react';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const estimatedReadingTime = useMemo((): number => {
    if (post) {
      const totalWords = post.data.content.reduce((acumulador, p) => {
        const listContent = RichText.asText(p.body).split(' ');
        const listHeading = p.heading.split(' ');
        const total = listContent.length + listHeading.length;
        return acumulador + total;
      }, 0);

      const total = Math.ceil(totalWords / 200);

      return total;
    }
  }, [post]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>Post | {post.data.title}</title>
      </Head>
      <Header />
      <main className={styles.contentContainer}>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt={post.data.title} />
        </div>

        <section className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <time className={styles.createdAt}>
              <FiCalendar size={20} />
              {format(new Date(post.first_publication_date), 'dd LLL yyyy', {
                locale: ptBR,
              })}
            </time>
            <span className={styles.author}>
              <FiUser size={20} />
              {post.data.author}
            </span>

            <time className={styles.estimatedReadingTime}>
              <FiClock size={20} /> {estimatedReadingTime} min
            </time>
          </div>

          <div className={styles.content}>
            {post.data.content.map(p => (
              <div key={p.heading}>
                <h2>{p.heading}</h2>
                {p.body.map(b => (
                  <p key={b.text}>{b.text}</p>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { fetch: ['post.title', 'post.subtitle', 'post.author'] }
  );

  const posts = response.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths: posts,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID<any>('post', String(slug), {});

  return {
    props: {
      post: response,
    },
    redirect: 60 * 30,
  };
};
