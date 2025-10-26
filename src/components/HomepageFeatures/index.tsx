import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'One storage for all signals',
    Svg: require('@site/static/img/DB.svg').default,
    description: (
      <>
        OTelDB supports storing traces, metrics, and logs in a single, unified
        database, simplifying data management and analysis.
      </>
    ),
  },
  {
    title: 'OpenTelemetry-first',
    Svg: require('@site/static/img/OpenTelemetry.svg').default,
    description: (
      <>
        OTelDB is built with a focus on OpenTelemetry, ensuring seamless
        integration and support for the OpenTelemetry ecosystem.
      </>
    ),
  },
  {
    title: 'Powered by ClickHouse',
    Svg: require('@site/static/img/clickhouse-yellow-badge.svg').default,
    description: (
      <>
        OTelDB leverages ClickHouse, a high-performance columnar database,
        providing fast query performance and scalability for large volumes of
        observability data.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
